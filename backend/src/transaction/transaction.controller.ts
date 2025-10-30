import { Controller, Get, Param, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('tx')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // removed unused tx query endpoints
}