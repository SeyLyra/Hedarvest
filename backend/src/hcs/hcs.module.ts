import { Module } from '@nestjs/common';
import { HcsService } from './hcs.service';

@Module({
  providers: [HcsService],
  exports: [HcsService],
})
export class HcsModule {}
