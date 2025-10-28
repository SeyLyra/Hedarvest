import { Module, forwardRef } from '@nestjs/common';
import { HcsService } from './hcs.service';
import { HcsController } from './hcs.controller';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [forwardRef(() => TransactionModule)],
  controllers: [HcsController],
  providers: [HcsService],
  exports: [HcsService],
})
export class HcsModule {}
