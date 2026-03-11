import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalEngineService } from './approval-engine.service';
import { ApprovalDelegationsModule } from '../approval-delegations/approval-delegations.module';

@Module({
  imports: [ApprovalDelegationsModule],
  controllers: [ApprovalsController],
  providers: [ApprovalEngineService],
  exports: [ApprovalEngineService],
})
export class ApprovalsModule {}
