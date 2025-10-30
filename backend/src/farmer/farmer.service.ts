import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma';
import {
  RegisterFarmerDto,
  DepositGrainDto,
  RedeemDto,
  FarmerLoginDto,
  FarmerRegisterDto,
  DepositCollateralDto,
  BorrowFundsDto,
} from './dto';
import { TransactionService } from '../transaction/transaction.service';
import { HederaService } from '../lib/hedera.service';
import { ContractService } from '../lib/contract.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import {
  TokenId,
  TransferTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar,
  AccountId,
  PrivateKey,
} from '@hashgraph/sdk';

@Injectable()
export class FarmerService {
  private readonly ENCRYPTION_KEY: Buffer;
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';

  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService,
    private hederaService: HederaService,
    private jwtService: JwtService,
    private contractService: ContractService,
  ) {
    // Use a secure encryption key from environment or generate one
    const key =
      process.env.ENCRYPTION_KEY ||
      'default-insecure-key-please-change-in-production';
    this.ENCRYPTION_KEY = crypto.scryptSync(key, 'salt', 32);
  }

  /**
   * Encrypt private key for secure storage
   */
  private encryptPrivateKey(privateKey: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.ENCRYPTION_ALGORITHM,
      this.ENCRYPTION_KEY,
      iv,
    );

    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt private key for transaction signing
   */
  private decryptPrivateKey(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      this.ENCRYPTION_ALGORITHM,
      this.ENCRYPTION_KEY,
      iv,
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Parse a decrypted private key string into a Hedera PrivateKey instance.
   * Supports both DER (toString()) and raw hex (toStringRaw()) formats.
   */
  private parsePrivateKey(possiblyRawKey: string): PrivateKey {
    const trimmed = (possiblyRawKey || '').trim();

    // Try standard parsing first (DER format from toString())
    try {
      const key = PrivateKey.fromString(trimmed);
      return key;
    } catch (err) {
      console.error(err);
    }

    // Check if it's raw hex (64 characters, from toStringRaw())
    const hexOnly = trimmed.replace(/^0x/i, '');
    const isHex64 = /^[0-9a-fA-F]{64}$/.test(hexOnly);

    if (isHex64) {
      if (typeof (PrivateKey as any).fromStringED25519 === 'function') {
        try {
          const key = (PrivateKey as any).fromStringED25519(hexOnly);
          return key;
        } catch (err) {
          console.error(err);
        }
      }

      try {
        const key = PrivateKey.fromString(`0x${hexOnly}`);
        return key;
      } catch (err) {}
      try {
        // Convert hex to bytes
        const seedBytes = Buffer.from(hexOnly, 'hex');
        if (seedBytes.length !== 32) {
          throw new Error(
            `Invalid seed length: ${seedBytes.length}, expected 32`,
          );
        }
        const keyStr = seedBytes.toString('hex');
      } catch (err) {
        // Provide helpful error
        throw new BadRequestException(
          `Private key is in raw hex format (from toStringRaw()). `,
        );
      }
    }

    throw new BadRequestException(
      `Unsupported private key format. Length: ${trimmed.length}, Is hex64: ${isHex64}`,
    );
  }

  async registerFarmer(registerFarmerDto: RegisterFarmerDto) {
    const { walletAddress, phoneNumber, nationalId } = registerFarmerDto;

    // Check if farmer already exists
    const existingFarmer = await this.prisma.farmer.findUnique({
      where: { walletAddress },
    });

    if (existingFarmer) {
      throw new BadRequestException('Farmer already registered');
    }

    // Create farmer
    const farmer = await this.prisma.farmer.create({
      data: {
        walletAddress,
        phoneNumber: phoneNumber || 'N/A',
        memberNumber: `MBR-${Date.now()}`,
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'farmer_registration',
      ref: `farmer_${farmer.id}`,
      entity: 'Farmer',
      meta: {
        walletAddress,
        phoneNumber,
        nationalId,
      },
    });

    return farmer;
  }

  async depositGrain(depositGrainDto: DepositGrainDto) {
    const {
      farmerId,
      warehouseId,
      grainType,
      weightKg,
      qualityGrade,
      moisturePercent,
    } = depositGrainDto;

    // Verify farmer exists
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    // Validate input
    if (
      !warehouseId ||
      typeof warehouseId !== 'string' ||
      warehouseId.trim().length === 0
    ) {
      throw new BadRequestException('warehouseId is required');
    }

    // Verify warehouse exists (by warehouseId code)
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Calculate tokens to mint (1 token per kg for now)
    const tokensMinted = weightKg;

    // Create grain deposit record (tokens will be minted after warehouse verification)
    const deposit = await this.prisma.grainDeposit.create({
      data: {
        farmerId,
        warehouseId: warehouse.id,
        grainType,
        weightKg,
        qualityGrade,
        moisturePercent,
        tokensMinted,
        hederaTxId: null, // Will be set after warehouse verification
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'grain_deposit',
      ref: `deposit_${deposit.id}`,
      entity: 'GrainDeposit',
      meta: {
        farmerId,
        warehouseId: warehouse.warehouseId,
        grainType,
        weightKg,
        qualityGrade,
        moisturePercent,
        tokensMinted,
        status: 'pending_verification',
      },
    });

    return deposit;
  }

  /**
   * Warehouse verifies grain deposit and mints crop tokens to farmer
   * This should be called by warehouse after physically verifying the grain
   */
  async verifyAndMintTokens(depositId: number, warehouseSignature: string) {
    // Get the grain deposit
    const deposit = await this.prisma.grainDeposit.findUnique({
      where: { id: depositId },
      include: { farmer: true },
    });

    if (!deposit) {
      throw new NotFoundException('Grain deposit not found');
    }

    if (deposit.hederaTxId) {
      throw new BadRequestException('Tokens already minted for this deposit');
    }

    // Verify farmer has a custodial wallet
    if (!deposit.farmer.isCustodial || !deposit.farmer.hederaAccountId) {
      throw new BadRequestException(
        'Farmer must have a custodial wallet to receive tokens',
      );
    }

    // TODO: Verify warehouse signature
    // For now, we'll skip signature verification

    // Determine which token to mint based on grain type
    const tokenIdMap: Record<string, string> = {
      wheat: process.env.WHEAT_TOKEN_ID || '0.0.7121333',
      rice: process.env.RICE_TOKEN_ID || '0.0.7121334',
      corn: process.env.CORN_TOKEN_ID || '0.0.7121335',
    };

    const tokenId = tokenIdMap[deposit.grainType.toLowerCase()];
    if (!tokenId) {
      throw new BadRequestException(
        `Unsupported grain type: ${deposit.grainType}`,
      );
    }

    // Convert human units (kg) to smallest token units using decimals (WHEAT/RICE/CORN use 8)
    const decimalsMap: Record<string, number> = {
      wheat: 8,
      rice: 8,
      corn: 8,
    };
    const decimals = decimalsMap[deposit.grainType.toLowerCase()] ?? 8;
    const smallestUnits = Math.floor(
      deposit.tokensMinted.toNumber() * Math.pow(10, decimals),
    );

    // Mint tokens to treasury (operator) first in smallest units
    await this.hederaService.mintToken(tokenId, smallestUnits);

    // Transfer minted tokens to farmer's account
    const transferResult = await this.hederaService.transferTokenToAccount(
      tokenId,
      deposit.farmer.hederaAccountId,
      smallestUnits,
    );

    // Update deposit record with transaction ID
    await this.prisma.grainDeposit.update({
      where: { id: depositId },
      data: {
        hederaTxId: transferResult.transactionId,
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'token_mint',
      ref: `deposit_${depositId}`,
      entity: 'GrainDeposit',
      meta: {
        farmerId: deposit.farmerId,
        grainType: deposit.grainType,
        tokensMinted: deposit.tokensMinted.toString(),
        tokenId,
        hederaTxId: transferResult.transactionId,
        farmerAccountId: deposit.farmer.hederaAccountId,
      },
    });

    return {
      success: true,
      transactionId: transferResult.transactionId,
      tokenId,
      amount: deposit.tokensMinted.toString(),
    };
  }

  async getFarmerProfile(farmerId: number) {
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
      include: {
        deposits: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    return farmer;
  }

  async getFarmerDeposits(farmerId: number) {
    return this.prisma.grainDeposit.findMany({
      where: { farmerId },
      orderBy: { depositedAt: 'desc' },
    });
  }

  async getFarmerLoans(farmerId: number) {
    // Loans are now stored in smart contracts, not database
    // Query from blockchain via ContractService
    throw new BadRequestException(
      'Loan data is stored in smart contracts. Use ContractService.getFarmerPosition() instead',
    );
  }

  async getFarmerByMemberNumber(memberNumber: string) {
    const farmer = await this.prisma.farmer.findUnique({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: { memberNumber } as any,
    });
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }
    return farmer;
  }

  async redeemTokens(redeemDto: RedeemDto) {
    const { farmerId, amount } = redeemDto;

    // Verify farmer exists
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
    });
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    // OTP must be verified prior to invoking this endpoint in the flow (checked via separate endpoint)

    // Process redemption on Hedera (burn/transfer as required)
    const hederaResult = await this.hederaService.processGrainDeposit(
      farmer.walletAddress,
      -amount,
    );

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'token_redemption',
      ref: `farmer_${farmerId}_redeem_${Date.now()}`,
      entity: 'Farmer',
      meta: { farmerId, amount, hederaTxId: hederaResult.transactionId },
    });

    return { success: true, transactionId: hederaResult.transactionId };
  }

  async registerFarmerWithAuth(farmerRegisterDto: FarmerRegisterDto) {
    const { email, password, walletAddress, phoneNumber, nationalId } =
      farmerRegisterDto;

    // Check if farmer already exists by email
    const existingFarmer = await this.prisma.farmer.findUnique({
      where: { email },
    });

    if (existingFarmer) {
      throw new BadRequestException(
        'Farmer already registered with this email',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine if we should create a custodial wallet
    const shouldCreateCustodialWallet = !walletAddress;

    let finalWalletAddress = walletAddress;
    let hederaAccountId: string | undefined;
    let encryptedPrivateKey: string | undefined;

    if (shouldCreateCustodialWallet) {
      // Create a custodial Hedera account automatically
      try {
        const custodialAccount =
          await this.hederaService.createCustodialAccount(email);

        finalWalletAddress = custodialAccount.evmAddress;
        hederaAccountId = custodialAccount.accountId;
        encryptedPrivateKey = this.encryptPrivateKey(
          custodialAccount.privateKey,
        );
      } catch (error) {
        throw new BadRequestException(
          'Failed to create wallet for farmer. Please try again.',
        );
      }
    }

    // Create farmer with authentication
    const farmer = await this.prisma.farmer.create({
      data: {
        email,
        password: hashedPassword,
        walletAddress: finalWalletAddress,
        hederaAccountId,
        encryptedPrivateKey,
        isCustodial: shouldCreateCustodialWallet,
        phoneNumber: phoneNumber || 'N/A',
        memberNumber: `MBR-${Date.now()}`,
      },
    });

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: farmer.id,
      email: farmer.email,
      type: 'farmer',
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'farmer_registration',
      ref: `farmer_${farmer.id}`,
      entity: 'Farmer',
      meta: {
        email,
        walletAddress: finalWalletAddress,
        hederaAccountId,
        isCustodial: shouldCreateCustodialWallet,
        phoneNumber,
        nationalId,
      },
    });

    return {
      farmer: {
        id: farmer.id,
        email: farmer.email,
        walletAddress: farmer.walletAddress,
        hederaAccountId: farmer.hederaAccountId,
        isCustodial: farmer.isCustodial,
        memberNumber: farmer.memberNumber,
        phoneNumber: farmer.phoneNumber,
      },
      token,
      message: shouldCreateCustodialWallet
        ? 'Account created successfully! Your wallet has been set up automatically.'
        : 'Account created successfully!',
    };
  }

  async createHederaWalletForFarmer(farmerId: number) {
    // Find farmer
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    if (farmer.hederaAccountId) {
      return {
        success: true,
        message: 'Farmer already has Hedera account',
        hederaAccountId: farmer.hederaAccountId,
      };
    }

    if (!farmer.email) {
      throw new BadRequestException(
        'Farmer must have an email to create custodial wallet',
      );
    }

    try {
      // Create custodial wallet
      const custodialAccount = await this.hederaService.createCustodialAccount(
        farmer.email,
      );

      // Encrypt private key
      const encryptedPrivateKey = this.encryptPrivateKey(
        custodialAccount.privateKey,
      );

      // Update farmer
      const updatedFarmer = await this.prisma.farmer.update({
        where: { id: farmerId },
        data: {
          hederaAccountId: custodialAccount.accountId,
          walletAddress: custodialAccount.evmAddress,
          encryptedPrivateKey,
          isCustodial: true,
        },
      });

      return {
        success: true,
        message: 'Hedera wallet created successfully',
        hederaAccountId: updatedFarmer.hederaAccountId,
        walletAddress: updatedFarmer.walletAddress,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create Hedera wallet: ${error.message || 'Unknown error'}`,
      );
    }
  }

  async loginFarmer(farmerLoginDto: FarmerLoginDto) {
    const { email, password } = farmerLoginDto;

    // Find farmer by email
    const farmer = await this.prisma.farmer.findUnique({
      where: { email },
    });

    if (!farmer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if farmer has password (for backward compatibility)
    if (!farmer.password) {
      throw new UnauthorizedException(
        'Please register with email and password first',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, farmer.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: farmer.id,
      email: farmer.email,
      type: 'farmer',
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'farmer_login',
      ref: `farmer_${farmer.id}`,
      entity: 'Farmer',
      meta: { email },
    });

    return {
      farmer: {
        id: farmer.id,
        email: farmer.email,
        walletAddress: farmer.walletAddress,
        hederaAccountId: farmer.hederaAccountId,
        memberNumber: farmer.memberNumber,
        phoneNumber: farmer.phoneNumber,
      },
      token,
    };
  }

  async depositCollateralSimple(
    farmerId: number,
    grainType: string,
    amount: number,
  ) {
    // Find farmer (ensure custodial wallet exists)
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
    });
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }
    if (!farmer.hederaAccountId) {
      throw new BadRequestException('Farmer has no Hedera account');
    }

    // Convert to smallest units (8 decimals for crop tokens)
    const decimalsMap: Record<string, number> = {
      wheat: 8,
      rice: 8,
      corn: 8,
    };
    const decimals = decimalsMap[grainType.toLowerCase()] ?? 8;
    const smallestUnits = Math.floor(amount * Math.pow(10, decimals));

    // For hackathon demo: pretend to call contract/lending pool and return success
    // In production, integrate with HederaService + ContractService to deposit
    await this.transactionService.logTransaction({
      kind: 'collateral_deposit',
      ref: `farmer_${farmerId}_${Date.now()}`,
      entity: 'Farmer',
      meta: { grainType, amount, smallestUnits },
    });

    return {
      success: true,
      message: 'Collateral deposit submitted',
      grainType,
      amount,
      smallestUnits,
      hederaAccountId: farmer.hederaAccountId,
      transactionId: `demo-${Date.now()}`,
    };
  }

  async getFarmerByEmail(email: string) {
    const farmer = await this.prisma.farmer.findUnique({
      where: { email },
    });
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }
    return farmer;
  }

  /**
   * Deposit crop tokens as collateral to lending pool using custodial wallet
   * This allows farmers to borrow USDC against their crop tokens
   */
  async depositCollateral(depositCollateralDto: DepositCollateralDto) {
    const { farmerId, cropType, amount } = depositCollateralDto;

    // Get farmer with custodial wallet details
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    if (
      !farmer.isCustodial ||
      !farmer.hederaAccountId ||
      !farmer.encryptedPrivateKey
    ) {
      throw new BadRequestException(
        'Farmer must have a custodial wallet to deposit collateral via backend',
      );
    }

    // Decrypt farmer's private key
    const decryptedKey = this.decryptPrivateKey(farmer.encryptedPrivateKey);
    const farmerPrivateKey = decryptedKey;

    // Get pool address for the crop type
    const poolAddress = await this.contractService.getPoolAddress(cropType);
    if (!poolAddress) {
      throw new BadRequestException(
        `No lending pool found for crop type: ${cropType}`,
      );
    }

    // Determine collateral token ID based on crop type
    const tokenIdMap: Record<string, string> = {
      wheat: process.env.WHEAT_TOKEN_ID || '0.0.7121333',
      rice: process.env.RICE_TOKEN_ID || '0.0.7121334',
    };

    const collateralTokenId = tokenIdMap[cropType.toLowerCase()];
    if (!collateralTokenId) {
      throw new BadRequestException(`Unsupported crop type: ${cropType}`);
    }

    // Convert amount to smallest units (assuming 8 decimals for crop tokens)
    const amountInSmallestUnits = Math.floor(amount * 1e8);

    try {
      // Initialize Hedera client - CRITICAL: Use farmer's account, not operator!
      const farmerAccountId = AccountId.fromString(farmer.hederaAccountId);
      const network = process.env.HEDERA_NETWORK || 'testnet';

      const Client = await import('@hashgraph/sdk').then((m) => m.Client);
      const client = Client.forName(network);

      // Parse farmer key BEFORE setting operator
      const farmerKey = this.parsePrivateKey(farmerPrivateKey);

      // Set client operator to FARMER account so msg.sender is correct
      client.setOperator(farmerAccountId, farmerKey);

      // Calculate the EVM address that will be used as msg.sender in the contract
      const farmerEvmAddress = `0x${farmerAccountId.toSolidityAddress()}`;

      // Verify the key matches the account
      const publicKeyFromKey = farmerKey.publicKey;

      // Get the account's current key to verify (optional check)
      // This is expensive, so we'll skip it for now and just try signing
      const tokenId = TokenId.fromString(collateralTokenId);
      // Pool may be provided as EVM (0x...) or as 0.0.x — handle both
      const poolAccountId = poolAddress.startsWith('0x')
        ? AccountId.fromSolidityAddress(poolAddress)
        : AccountId.fromString(poolAddress);

      // Step 1: Ensure farmer is associated with the collateral token
      try {
        await this.hederaService.ensureTokenAssociation(
          farmer.hederaAccountId,
          collateralTokenId,
          farmerPrivateKey,
        );
      } catch (assocError) {
        console.error(assocError);
      }

      // Step 2: Transfer collateral tokens from farmer to pool contract
      const transferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, farmerAccountId, -amountInSmallestUnits)
        .addTokenTransfer(tokenId, poolAccountId, amountInSmallestUnits)
        .freezeWith(client);

      const transferTxSigned = await transferTx.sign(farmerKey);
      const transferTxResponse = await transferTxSigned.execute(client);
      const transferReceipt = await transferTxResponse.getReceipt(client);

      if (transferReceipt.status.toString() !== 'SUCCESS') {
        throw new Error(
          `Token transfer failed: ${transferReceipt.status.toString()}`,
        );
      }

      // Step 3: Call depositCollateral() on the lending pool contract
      const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(
          poolAddress.startsWith('0x')
            ? ContractId.fromSolidityAddress(poolAddress)
            : ContractId.fromString(poolAddress),
        )
        .setGas(1500000)
        .setMaxTransactionFee(new Hbar(5))
        .setFunction(
          'depositCollateral',
          new ContractFunctionParameters().addUint256(amountInSmallestUnits),
        )
        .freezeWith(client);

      // Transaction is already signed by farmer key via client.setOperator(farmerAccountId, farmerKey)
      // But we still need to sign explicitly to ensure it's the payer
      const contractTxSigned = await contractExecuteTx.sign(farmerKey);
      const contractTxResponse = await contractTxSigned.execute(client);
      const contractReceipt = await contractTxResponse.getReceipt(client);

      if (contractReceipt.status.toString() !== 'SUCCESS') {
        throw new Error(
          `Contract execution failed: ${contractReceipt.status.toString()}`,
        );
      }

      // Log transaction
      await this.transactionService.logTransaction({
        kind: 'collateral_deposit',
        ref: `farmer_${farmerId}_collateral`,
        entity: 'Farmer',
        meta: {
          farmerId,
          cropType,
          amount,
          amountInSmallestUnits,
          collateralTokenId,
          poolAddress,
          transferTxId: transferTxResponse.transactionId.toString(),
          contractTxId: contractTxResponse.transactionId.toString(),
        },
      });

      const txId = contractTxResponse.transactionId.toString();
      const mirrorNodeUrl = `https://hashscan.io/testnet/transaction/${txId}`;

      return {
        success: true,
        message: 'Collateral deposited successfully',
        transferTxId: transferTxResponse.transactionId.toString(),
        contractTxId: txId,
        amount: amount,
        cropType: cropType,
        poolAddress: poolAddress,
        mirrorNodeUrl: mirrorNodeUrl,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to deposit collateral: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Return max borrow allowance after collateral: 60% LTV of collateral value.
   * Uses on-chain pool info if available, falls back to fixed 60% of deposited amount (1:1 price).
   */
  async getBorrowAllowance(farmerId: number, cropType: string) {
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
    });
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    // Prefer on-chain position from Hedera/contracts when available
    try {
      let farmerAddress: string | null = null;

      if (farmer.hederaAccountId) {
        try {
          const accountId = AccountId.fromString(farmer.hederaAccountId);
          farmerAddress = `0x${accountId.toSolidityAddress()}`;
        } catch (convErr) {}
      }

      // Fallback to walletAddress only if hederaAccountId conversion failed
      if (!farmerAddress && farmer.walletAddress) {
        if (farmer.walletAddress.startsWith('0x')) {
          farmerAddress = farmer.walletAddress;
        } else {
          // walletAddress might be a Hedera Account ID, try converting
          try {
            const accountId = AccountId.fromString(farmer.walletAddress);
            farmerAddress = `0x${accountId.toSolidityAddress()}`;
          } catch (e) {}
        }
      }
      if (!farmerAddress) {
        throw new BadRequestException(
          `Cannot determine farmer EVM address. Need either hederaAccountId or valid walletAddress.`,
        );
      }

      // This method computes collateral, price, baseLTV, and maxBorrow on-chain
      const position = await this.hederaService.getFarmerPosition(
        cropType,
        farmerAddress,
      );

      return {
        success: true,
        source: 'onchain',
        collateral: position.collateral,
        borrows: position.borrows,
        collateralValueUSD: position.collateralValueUSD,
        maxBorrowUSD: position.maxBorrow,
        loanToValue: position.loanToValue, // 18 decimals
      };
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      // If on-chain check fails, assume no collateral (don't count owned tokens as collateral)
      return {
        success: true,
        source: 'fallback',
        error: errorMsg, // Include error message for debugging
        collateral: '0',
        collateralTokens: '0',
        maxBorrowUSD: '0',
        maxBorrowTokens: '0',
        baseLTV: 0.6,
      };
    }
  }

  /**
   * Borrow funds (USDC) from the lending pool using deposited collateral
   */
  async borrowFunds(borrowFundsDto: BorrowFundsDto) {
    const { farmerId, cropType, amount } = borrowFundsDto;

    // Get farmer with custodial wallet details
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    if (
      !farmer.isCustodial ||
      !farmer.hederaAccountId ||
      !farmer.encryptedPrivateKey
    ) {
      throw new BadRequestException(
        'Farmer must have a custodial wallet to borrow funds via backend',
      );
    }

    // Decrypt farmer's private key
    const decryptedKey = this.decryptPrivateKey(farmer.encryptedPrivateKey);
    const farmerPrivateKey = decryptedKey;

    // Get pool address for the crop type
    const poolAddress = await this.contractService.getPoolAddress(cropType);
    if (!poolAddress) {
      throw new BadRequestException(
        `No lending pool found for crop type: ${cropType}`,
      );
    }

    // Convert amount to smallest units (USDC has 6 decimals)
    const amountInSmallestUnits = Math.floor(amount * 1e6);

    try {
      // Initialize Hedera client - CRITICAL: Use farmer's account, not operator!
      const farmerAccountId = AccountId.fromString(farmer.hederaAccountId);
      const network = process.env.HEDERA_NETWORK || 'testnet';

      const Client = await import('@hashgraph/sdk').then((m) => m.Client);
      const client = Client.forName(network);

      // Parse farmer key BEFORE setting operator
      const farmerKey = this.parsePrivateKey(farmerPrivateKey);

      // Set client operator to FARMER account so msg.sender is correct
      client.setOperator(farmerAccountId, farmerKey);

      // Calculate the EVM address that will be used as msg.sender
      const farmerEvmAddress = `0x${farmerAccountId.toSolidityAddress()}`;

      // Call borrow(uint256 amount) on the lending pool contract
      const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(
          poolAddress.startsWith('0x')
            ? ContractId.fromSolidityAddress(poolAddress)
            : ContractId.fromString(poolAddress),
        )
        .setGas(3000000)
        .setMaxTransactionFee(new Hbar(5))
        .setFunction(
          'borrow',
          new ContractFunctionParameters().addUint256(amountInSmallestUnits),
        )
        .freezeWith(client);

      const contractTxSigned = await contractExecuteTx.sign(farmerKey);

      const contractTxResponse = await contractTxSigned.execute(client);
      const contractReceipt = await contractTxResponse.getReceipt(client);

      if (contractReceipt.status.toString() !== 'SUCCESS') {
        throw new Error(
          `Contract execution failed: ${contractReceipt.status.toString()}`,
        );
      }

      // Log transaction
      await this.transactionService.logTransaction({
        kind: 'borrow',
        ref: `farmer_${farmerId}_borrow`,
        entity: 'Farmer',
        meta: {
          farmerId,
          cropType,
          amount,
          amountInSmallestUnits,
          poolAddress,
          contractTxId: contractTxResponse.transactionId.toString(),
        },
      });

      const txId = contractTxResponse.transactionId.toString();
      const mirrorNodeUrl = `https://hashscan.io/testnet/transaction/${txId}`;

      return {
        success: true,
        message: `Successfully borrowed ${amount} USDC`,
        contractTxId: txId,
        amount: amount,
        cropType: cropType,
        poolAddress: poolAddress,
        mirrorNodeUrl: mirrorNodeUrl,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to borrow funds: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
