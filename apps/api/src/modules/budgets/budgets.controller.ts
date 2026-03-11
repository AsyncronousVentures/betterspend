import {
  Controller, Get, Post, Patch, Param, Body, Query, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BudgetsService, CreateBudgetInput } from './budgets.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';

@ApiTags('budgets')
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get('check')
  @ApiOperation({ summary: 'Check budget availability for a department' })
  @ApiQuery({ name: 'departmentId', required: true })
  @ApiQuery({ name: 'amount', required: true })
  @ApiQuery({ name: 'fiscalYear', required: true })
  checkBudget(
    @CurrentOrgId() orgId: string,
    @Query('departmentId') departmentId: string,
    @Query('amount') amount: string,
    @Query('fiscalYear') fiscalYear: string,
  ) {
    return this.budgetsService.checkBudget(
      orgId, departmentId, parseFloat(amount), parseInt(fiscalYear, 10),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all budgets' })
  findAll(@CurrentOrgId() orgId: string) {
    return this.budgetsService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget detail' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOrgId() orgId: string) {
    return this.budgetsService.findOne(id, orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a budget with optional periods' })
  create(@Body() body: CreateBudgetInput, @CurrentOrgId() orgId: string) {
    return this.budgetsService.create(orgId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { name?: string; totalAmount?: number; currency?: string },
    @CurrentOrgId() orgId: string,
  ) {
    return this.budgetsService.update(id, orgId, body);
  }
}
