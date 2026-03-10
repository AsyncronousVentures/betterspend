import {
  Controller, Get, Post, Param, Body, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApprovalEngineService } from './approval-engine.service';

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002';

@ApiTags('approvals')
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalEngineService: ApprovalEngineService) {}

  @Get()
  @ApiOperation({ summary: 'List pending approval requests' })
  listPending() {
    return this.approvalEngineService.listPending(DEMO_ORG_ID);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval request detail' })
  getRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvalEngineService.getRequest(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a request at the current step' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { comment?: string },
  ) {
    return this.approvalEngineService.processAction(id, DEMO_USER_ID, 'approve', body?.comment);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a request' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { comment?: string },
  ) {
    return this.approvalEngineService.processAction(id, DEMO_USER_ID, 'reject', body?.comment);
  }
}
