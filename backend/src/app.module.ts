import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FarmerModule } from './farmer/farmer.module';
import { AgentModule } from './agent/agent.module';
import { PoolModule } from './pool/pool.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 20,
      },
    ]),
    AuthModule,
    FarmerModule,
    AgentModule,
    PoolModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Optionally add a global guard later if needed:
    // { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
