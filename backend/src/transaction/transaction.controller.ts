import { Controller, Get, Param, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('tx')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('ref/:ref')
  async getTransactionsByRef(@Param('ref') ref: string) {
    return this.transactionService.getTransactionsByRef(ref);
  }

  @Get('kind/:kind')
  async getTransactionsByKind(@Param('kind') kind: string) {
    return this.transactionService.getTransactionsByKind(kind);
  }

  @Get('entity/:entity')
  async getTransactionsByEntity(@Param('entity') entity: string) {
    return this.transactionService.getTransactionsByEntity(entity);
  }

  @Get()
  async getAllTransactions(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.transactionService.getAllTransactions(limitNum, offsetNum);
  }
}