import { Module } from '@nestjs/common';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
import { HederaService } from '../lib/hedera.service';
import { ContractService } from '../lib/contract.service';
import { HcsService } from '../hcs/hcs.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TokensController],
  providers: [TokensService, HederaService, ContractService, HcsService],
  exports: [TokensService],
})
export class TokensModule {}

