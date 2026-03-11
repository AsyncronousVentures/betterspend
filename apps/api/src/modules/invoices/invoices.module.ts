import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { MatchingService } from './matching.service';
import { BudgetsModule } from '../budgets/budgets.module';

@Module({
  imports: [BudgetsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, MatchingService],
  exports: [InvoicesService, MatchingService],
})
export class InvoicesModule {}
