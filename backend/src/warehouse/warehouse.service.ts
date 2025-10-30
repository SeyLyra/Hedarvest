import { Injectable, NotFoundException, BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma';
import {
  CreateDeliveryDto,
  UpdateDeliveryStatusDto,
  ReceiveDeliveryDto,
  VerifyDeliveryDto,
} from './dto';
import { TransactionService } from '../transaction/transaction.service';
import { HcsService } from '../hcs/hcs.service';
import { HederaService } from '../lib/hedera.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService,
    private hederaService: HederaService,
    private hcsService: HcsService,
  ) {}

  /**
   * Warehouse operator login
   */
  async warehouseLogin(email: string, password: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { email },
    });

    if (!warehouse) {
      throw new BadRequestException('Invalid credentials');
    }

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, warehouse.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (warehouse.status !== 'active') {
      throw new UnauthorizedException('Warehouse account is not active');
    }

    return {
      warehouse: {
        id: warehouse.warehouseId,
        name: warehouse.name,
        email: warehouse.email,
        manager: warehouse.manager,
      },
    };
  }

  /**
   * Create a new delivery (farmer request)
   */
  async createDeliveryRequest(createDeliveryDto: CreateDeliveryDto) {
    const { farmerId, ...deliveryData } = createDeliveryDto;

    // Verify farmer exists
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    // Create delivery
    const delivery = await this.prisma.delivery.create({
      data: {
        farmerId,
        warehouseId: deliveryData.warehouseId,
        cropType: deliveryData.cropType,
        variety: deliveryData.variety,
        estimatedWeight: deliveryData.estimatedWeight,
        unit: deliveryData.unit || 'kg',
        estimatedGrade: deliveryData.estimatedGrade,
        moistureContent: deliveryData.moistureContent,
        temperature: deliveryData.temperature,
        scheduledDate: new Date(deliveryData.scheduledDate),
        location: deliveryData.location,
        notes: deliveryData.notes,
        photos: deliveryData.photos || [],
        status: 'pending',
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'delivery_request',
      ref: `delivery_${delivery.id}`,
      entity: 'Delivery',
      meta: {
        farmerId,
        warehouseId: deliveryData.warehouseId,
        cropType: deliveryData.cropType,
        estimatedWeight: deliveryData.estimatedWeight,
      },
    });

    return delivery;
  }

  /**
   * Get all deliveries for a warehouse
   */
  async getDeliveryRequests(warehouseId: string, status?: string) {
    const where: any = { warehouseId };

    if (status) {
      where.status = status;
    }

    const result = await this.prisma.delivery.findMany({
      where,
      include: {
        farmer: {
          select: {
            id: true,
            memberNumber: true,
            phoneNumber: true,
            walletAddress: true,
            email: true, // Include email for name display
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    // Check if farmer data is missing and fetch it separately
    const resultWithFarmerData = await Promise.all(
      result.map(async (delivery) => {
        if (!delivery.farmer) {
          this.logger.log(`Fetching farmer data for farmerId: ${delivery.farmerId}`);
          const farmer = await this.prisma.farmer.findUnique({
            where: { id: delivery.farmerId },
            select: {
              id: true,
              memberNumber: true,
              phoneNumber: true,
              walletAddress: true,
              email: true,
            },
          });
          this.logger.log(`Farmer data: ${JSON.stringify(farmer)}`);
          return { ...delivery, farmer };
        }
        this.logger.log(
          `Farmer data already included: ${JSON.stringify(delivery.farmer)}`,
        );
        return delivery;
      })
    );

    this.logger.log(`Found ${resultWithFarmerData.length} deliveries for warehouse ${warehouseId}`);
    if (resultWithFarmerData.length > 0) {
      this.logger.log('Sample delivery (first item):', JSON.stringify(resultWithFarmerData[0], null, 2));
    }
    
    return resultWithFarmerData;
  }

  /**
   * Get deliveries for a specific farmer
   */
  async getFarmerDeliveries(farmerId: number) {
    return this.prisma.delivery.findMany({
      where: { farmerId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a specific delivery
   */
  async getDeliveryRequest(id: number) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: { farmer: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return delivery;
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(id: number, updateDto: UpdateDeliveryStatusDto) {
    const delivery = await this.getDeliveryRequest(id);

    const updated = await this.prisma.delivery.update({
      where: { id },
      data: {
        status: updateDto.status,
        notes: updateDto.notes || delivery.notes,
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'delivery_status_update',
      ref: `delivery_${id}`,
      entity: 'Delivery',
      meta: {
        newStatus: updateDto.status,
        notes: updateDto.notes,
      },
    });

    return updated;
  }

  /**
   * Receive delivery at warehouse (update Delivery with arrival data)
   */
  async receiveDelivery(deliveryId: number, receiveDto: ReceiveDeliveryDto) {
    const delivery = await this.getDeliveryRequest(deliveryId);

    // MVP: Skip status validation for demo purposes
    // if (deliveryRequest.status !== 'confirmed' && deliveryRequest.status !== 'in_transit') {
    //   throw new BadRequestException(
    //     'Delivery must be confirmed or in transit before receiving'
    //   );
    // }

    // If already has arrivalDate, prevent duplicate receiving
    if (delivery.arrivalDate) {
      throw new BadRequestException('Delivery already received');
    }

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        arrivalDate: receiveDto.arrivalDate ? new Date(receiveDto.arrivalDate) : new Date(),
        actualWeight: receiveDto.actualWeight,
        actualGrade: receiveDto.grade,
        status: 'received',
        priority: receiveDto.priority,
        estimatedValue: receiveDto.estimatedValue,
        storageLocation: receiveDto.storageLocation,
        notes: receiveDto.notes || delivery.notes,
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'delivery_received',
      ref: `delivery_${deliveryId}`,
      entity: 'Delivery',
      meta: {
        deliveryId,
        actualWeight: receiveDto.actualWeight,
        estimatedValue: receiveDto.estimatedValue,
      },
    });

    return updated;
  }

  /**
   * Get received deliveries for warehouse
   */
  async getIncomingDeliveries(warehouseId: string, status?: string) {
    const where: any = { warehouseId };
    if (status) where.status = status;
    // Consider deliveries that have arrived
    const deliveries = await this.prisma.delivery.findMany({
      where,
      include: { farmer: true },
      orderBy: { arrivalDate: 'desc' },
    });
    return deliveries.filter(d => d.arrivalDate);
  }

  /**
   * Update delivery status (post-arrival)
   */
  async updateIncomingDeliveryStatus(id: number, status: string, notes?: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    const updated = await this.prisma.delivery.update({
      where: { id },
      data: { status, notes: notes || delivery.notes },
    });
    await this.transactionService.logTransaction({
      kind: 'delivery_status_update',
      ref: `delivery_${id}`,
      entity: 'Delivery',
      meta: { newStatus: status, notes },
    });
    return updated;
  }

  /**
   * Verify delivery and mint tokens
   */
  async verifyAndMintTokens(deliveryId: number, verifyDto: VerifyDeliveryDto) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { farmer: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status !== 'inspecting' && delivery.status !== 'pending' && delivery.status !== 'received') {
      throw new BadRequestException('Delivery must be pending, received, or inspecting before verification');
    }

    const farmer = delivery.farmer;
    const warehouse = await this.prisma.warehouse.findUnique({ where: { warehouseId: delivery.warehouseId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found for delivery');

    // Create grain deposit record with verified data
    const grainDeposit = await this.prisma.grainDeposit.create({
      data: {
        farmerId: farmer.id,
        agentId: farmer.agentId,
        warehouseId: warehouse.id,
        grainType: delivery.cropType,
        weightKg: verifyDto.finalWeight,
        qualityGrade: verifyDto.finalGrade,
        moisturePercent: verifyDto.moisturePercent,
        tokensMinted: verifyDto.finalWeight, // 1:1 ratio for now
        hederaTxId: null, // Will be updated after minting
      },
    });

    // Update delivery with verification results
    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'verified',
        actualGrade: verifyDto.finalGrade,
        actualWeight: verifyDto.finalWeight,
        grainDepositId: grainDeposit.id,
        notes: verifyDto.notes || delivery.notes,
      },
    });

    // Mint crop tokens to farmer using Hedera Service
    let hederaTxId: string | null = null;
    let tokenId: string | null = null;
    let tokenAmount = 0;

    try {
      const farmerWallet = farmer.walletAddress;
      if (!farmerWallet) {
        throw new Error('Farmer wallet address not found');
      }

      const mintResult = await this.hederaService.mintCropTokens(
        delivery.cropType,
        verifyDto.finalWeight,
        farmerWallet,
      );

      hederaTxId = mintResult.transactionId;
      tokenId = mintResult.tokenId;
      tokenAmount = mintResult.amount;

      // Update grain deposit with Hedera transaction ID
      await this.prisma.grainDeposit.update({
        where: { id: grainDeposit.id },
        data: {
          hederaTxId: hederaTxId,
          tokensMinted: verifyDto.finalWeight,
        },
      });

      this.logger.log(`Minted ${tokenAmount} ${delivery.cropType} tokens to farmer ${farmerWallet}`);
    } catch (error) {
      this.logger.error('Failed to mint tokens:', error);
      // Continue even if minting fails, but mark it in the logs
      hederaTxId = `ERROR: ${error.message}`;
    }

    // Publish HCS event for tokenization/issuance (mock-safe)
    try {
      await this.hcsService.publishEvent('GrainTokenized', {
        farmerId: farmer.id,
        farmerEmail: farmer.email,
        cropType: delivery.cropType,
        verifiedWeight: verifyDto.finalWeight,
        grade: verifyDto.finalGrade,
        hederaTxId,
        deliveryId,
        grainDepositId: grainDeposit.id,
        timestamp: new Date().toISOString(),
      });
    } catch (hcsErr) {
      this.logger.warn('Failed to publish HCS event for tokenization:', hcsErr);
    }

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'delivery_verified_and_minted',
      ref: `delivery_${deliveryId}`,
      entity: 'GrainDeposit',
      meta: {
        grainDepositId: grainDeposit.id,
        finalWeight: verifyDto.finalWeight,
        finalGrade: verifyDto.finalGrade,
        tokensMinted: verifyDto.finalWeight,
        hederaTxId,
        tokenId,
        tokenAmount,
        farmerWallet: farmer.walletAddress,
      },
    });

    return {
      delivery,
      grainDeposit,
      message: 'Delivery verified and tokens minted successfully',
      hederaTxId,
      mirrorNodeUrl:
        hederaTxId && !hederaTxId.startsWith('ERROR:')
          ? `https://hashscan.io/testnet/transaction/${hederaTxId}`
          : undefined,
    };
  }

  /**
   * Get issued receipts (grain deposits) for warehouse
   */
  async getIssuedReceipts(warehouseId: string, status?: string) {
    // Get grain deposits that were created from warehouse verifications
    // For now, return all grain deposits - you can add warehouse filtering later
    const where: any = {};

    if (status) {
      // Filter by hederaTxId presence
      if (status === 'minted') {
        where.hederaTxId = { not: null };
      } else if (status === 'pending') {
        where.hederaTxId = null;
      }
    }

    return this.prisma.grainDeposit.findMany({
      where,
      include: {
        farmer: {
          select: {
            id: true,
            memberNumber: true,
            walletAddress: true,
            email: true,
          },
        },
      },
      orderBy: {
        depositedAt: 'desc',
      },
    });
  }

  /**
   * Reject delivery
   */
  async rejectDelivery(deliveryId: number, reason: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: 'rejected', notes: reason },
    });
    await this.transactionService.logTransaction({
      kind: 'delivery_rejected',
      ref: `delivery_${deliveryId}`,
      entity: 'Delivery',
      meta: { reason },
    });
    return { message: 'Delivery rejected', reason };
  }
}
