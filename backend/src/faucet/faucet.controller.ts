import { Controller, Post, Body, Logger, Get, Param } from '@nestjs/common';
import { FaucetService } from './faucet.service';
import { MintTokensDto } from './dto/mint-tokens.dto';

@Controller('faucet')
export class FaucetController {
  private readonly logger = new Logger(FaucetController.name);

  constructor(private readonly faucetService: FaucetService) {}

  @Post('mint')
  async mintTokens(@Body() mintRequest: MintTokensDto) {
    this.logger.log(`Minting ${mintRequest.amount} USDT to ${mintRequest.address}`);
    
    try {
      const result = await this.faucetService.mintTokens(
        mintRequest.address,
        mintRequest.amount.toString()
      );
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        amount: mintRequest.amount,
        address: mintRequest.address
      };
    } catch (error) {
      this.logger.error('Failed to mint tokens:', error);
      throw error;
    }
  }

  @Get('balance/:address')
  async getBalance(@Param('address') address: string) {
    this.logger.log(`Getting balance for ${address}`);
    
    try {
      const result = await this.faucetService.getTokenBalance(address);
      
      return {
        success: true,
        balance: result.balance,
        tokenId: result.tokenId,
        hbarBalance: result.hbarBalance,
        isAssociated: result.isAssociated,
        address: address
      };
    } catch (error) {
      this.logger.error('Failed to get balance:', error);
      return {
        success: false,
        balance: '0',
        tokenId: process.env.USDT_TOKEN_ID || '0.0.6951126',
        isAssociated: false,
        address: address
      };
    }
  }
}
