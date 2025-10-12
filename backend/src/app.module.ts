import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FarmerModule } from './farmer/farmer.module';
import { AgentModule } from './agent/agent.module';
import { PoolsModule } from './pools/pools.module';
import { InvestorModule } from './investor/investor.module';
import { TransactionModule } from './transaction/transaction.module';
import { HcsModule } from './hcs/hcs.module';
import { FaucetModule } from './faucet/faucet.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 20,
      },
    ]),
    ScheduleModule.forRoot(),
    HcsModule,
    AuthModule,
    FarmerModule,
    AgentModule,
    PoolsModule,
    InvestorModule,
    TransactionModule,
    FaucetModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Optionally add a global guard later if needed:
    // { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
