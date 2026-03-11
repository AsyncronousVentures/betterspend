import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvoicesService, CreateInvoiceInput } from './invoices.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all invoices' })
  findAll(@CurrentOrgId() orgId: string) {
    return this.invoicesService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Param('id') id: string, @CurrentOrgId() orgId: string) {
    return this.invoicesService.findOne(id, orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create an invoice (auto-runs 3-way match if PO linked)' })
  create(@Body() body: CreateInvoiceInput, @CurrentOrgId() orgId: string) {
    return this.invoicesService.create(orgId, body);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'Re-run 3-way match on an invoice' })
  runMatch(@Param('id') id: string, @CurrentOrgId() orgId: string) {
    return this.invoicesService.runMatch(id, orgId);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a matched invoice for payment' })
  approve(@Param('id') id: string, @CurrentOrgId() orgId: string, @CurrentUserId() userId: string) {
    return this.invoicesService.approve(id, orgId, userId);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Mark an approved invoice as paid' })
  markPaid(@Param('id') id: string, @CurrentOrgId() orgId: string, @CurrentUserId() userId: string) {
    return this.invoicesService.markPaid(id, orgId, userId);
  }
}
