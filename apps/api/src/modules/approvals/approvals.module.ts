import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalEngineService } from './approval-engine.service';

@Module({
  controllers: [ApprovalsController],
  providers: [ApprovalEngineService],
  exports: [ApprovalEngineService],
})
export class ApprovalsModule {}
