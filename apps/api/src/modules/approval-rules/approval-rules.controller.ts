import {
  Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApprovalRulesService, CreateApprovalRuleInput, UpdateApprovalRuleInput } from './approval-rules.service';

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

@ApiTags('approval-rules')
@Controller('approval-rules')
export class ApprovalRulesController {
  constructor(private readonly approvalRulesService: ApprovalRulesService) {}

  @Get()
  @ApiOperation({ summary: 'List all approval rules' })
  findAll() {
    return this.approvalRulesService.findAll(DEMO_ORG_ID);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval rule detail' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvalRulesService.findOne(id, DEMO_ORG_ID);
  }

  @Post()
  @ApiOperation({ summary: 'Create an approval rule with steps' })
  create(@Body() body: CreateApprovalRuleInput) {
    return this.approvalRulesService.create(DEMO_ORG_ID, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update approval rule metadata' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateApprovalRuleInput,
  ) {
    return this.approvalRulesService.update(id, DEMO_ORG_ID, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an approval rule' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvalRulesService.remove(id, DEMO_ORG_ID);
  }
}
