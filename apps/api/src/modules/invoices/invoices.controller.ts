import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvoicesService, CreateInvoiceInput } from './invoices.service';

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_ADMIN_ID = '00000000-0000-0000-0000-000000000002';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all invoices' })
  findAll() {
    return this.invoicesService.findAll(DEMO_ORG_ID);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id, DEMO_ORG_ID);
  }

  @Post()
  @ApiOperation({ summary: 'Create an invoice (auto-runs 3-way match if PO linked)' })
  create(@Body() body: CreateInvoiceInput) {
    return this.invoicesService.create(DEMO_ORG_ID, body);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'Re-run 3-way match on an invoice' })
  runMatch(@Param('id') id: string) {
    return this.invoicesService.runMatch(id, DEMO_ORG_ID);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a matched invoice for payment' })
  approve(@Param('id') id: string) {
    return this.invoicesService.approve(id, DEMO_ORG_ID, DEMO_ADMIN_ID);
  }
}
