import { Controller, Post, Body, Logger } from '@nestjs/common';
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
}
