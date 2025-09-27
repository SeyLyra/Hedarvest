import { Module } from '@nestjs/common';
import { HcsService } from './hcs.service';
import { HcsController } from './hcs.controller';
import { PrismaService } from '../lib/prisma';

@Module({
  controllers: [HcsController],
  providers: [HcsService, PrismaService],
  exports: [HcsService],
})
export class HcsModule {}
