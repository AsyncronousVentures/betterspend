import {
  Controller, Get, Post, Param, Body, Query, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BudgetsService, CreateBudgetInput } from './budgets.service';

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

@ApiTags('budgets')
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  // NOTE: this route must appear before ':id' to avoid routing conflicts
  @Get('check')
  @ApiOperation({ summary: 'Check budget availability for a department' })
  @ApiQuery({ name: 'departmentId', required: true })
  @ApiQuery({ name: 'amount', required: true })
  @ApiQuery({ name: 'fiscalYear', required: true })
  checkBudget(
    @Query('departmentId') departmentId: string,
    @Query('amount') amount: string,
    @Query('fiscalYear') fiscalYear: string,
  ) {
    return this.budgetsService.checkBudget(
      DEMO_ORG_ID,
      departmentId,
      parseFloat(amount),
      parseInt(fiscalYear, 10),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all budgets' })
  findAll() {
    return this.budgetsService.findAll(DEMO_ORG_ID);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget detail' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetsService.findOne(id, DEMO_ORG_ID);
  }

  @Post()
  @ApiOperation({ summary: 'Create a budget with optional periods' })
  create(@Body() body: CreateBudgetInput) {
    return this.budgetsService.create(DEMO_ORG_ID, body);
  }
}
