import { Module } from '@nestjs/common';
import { ApprovalDelegationsController } from './approval-delegations.controller';
import { ApprovalDelegationsService } from './approval-delegations.service';

@Module({
  controllers: [ApprovalDelegationsController],
  providers: [ApprovalDelegationsService],
  exports: [ApprovalDelegationsService],
})
export class ApprovalDelegationsModule {}
