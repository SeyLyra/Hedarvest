import {
  Controller,
  Post,
  Body,
  Logger,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { FaucetService } from './faucet.service';
import { MintTokensDto } from './dto/mint-tokens.dto';

@Controller('faucet')
export class FaucetController {
  private readonly logger = new Logger(FaucetController.name);

  constructor(private readonly faucetService: FaucetService) {}

  @Post('mint')
  async mintTokens(@Body() mintRequest: MintTokensDto) {
    this.logger.log(
      `Minting ${mintRequest.amount} ${mintRequest.tokenType?.toUpperCase() || 'USDC'} to ${mintRequest.address}`,
    );

    try {
      const result = await this.faucetService.mintTokens(
        mintRequest.address,
        mintRequest.amount.toString(),
        mintRequest.tokenType || 'usdc',
      );

      return {
        success: true,
        transactionHash:
          'transactionHash' in result
            ? result.transactionHash
            : 'mintTransactionId' in result
              ? result.mintTransactionId
              : 'pending',
        amount: mintRequest.amount,
        address: mintRequest.address,
        tokenType: mintRequest.tokenType || 'usdc',
        tokenSymbol:
          'tokenSymbol' in result
            ? result.tokenSymbol
            : mintRequest.tokenType?.toUpperCase() || 'USDC',
      };
    } catch (error) {
      this.logger.error('Failed to mint tokens:', error);
      throw error;
    }
  }

  @Get('balance/:address')
  async getBalance(
    @Param('address') address: string,
    @Query('tokenType') tokenType?: string,
  ) {
    this.logger.log(`Getting ${tokenType || 'USDC'} balance for ${address}`);

    try {
      const result = await this.faucetService.getTokenBalance(
        address,
        tokenType || 'usdc',
      );

      return {
        success: true,
        balance: result.balance,
        tokenId: result.tokenId,
        hbarBalance: result.hbarBalance,
        isAssociated: result.isAssociated,
        address: address,
        tokenType: tokenType || 'usdc',
      };
    } catch (error) {
      this.logger.error('Failed to get balance:', error);
      return {
        success: false,
        balance: '0',
        tokenId: process.env.USDC_MOCK_TOKEN_ID || '0.0.7115536',
        isAssociated: false,
        address: address,
        tokenType: tokenType || 'usdc',
      };
    }
  }
}
