import { Module } from '@nestjs/common';
import { RequisitionsController } from './requisitions.controller';
import { RequisitionsService } from './requisitions.service';
import { AiRequisitionService } from './ai-requisition.service';
import { ApprovalsModule } from '../approvals/approvals.module';
import { BudgetsModule } from '../budgets/budgets.module';

@Module({
  imports: [ApprovalsModule, BudgetsModule],
  controllers: [RequisitionsController],
  providers: [RequisitionsService, AiRequisitionService],
  exports: [RequisitionsService],
})
export class RequisitionsModule {}
