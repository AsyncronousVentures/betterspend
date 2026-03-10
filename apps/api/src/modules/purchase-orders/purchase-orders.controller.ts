import {
  Controller, Get, Post, Patch, Param, Body, Query, ParseUUIDPipe,
  HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { PurchaseOrdersService, createPoSchema, changeOrderSchema } from './purchase-orders.service';
import { PdfService } from './pdf.service';

// Temporary: hardcoded until auth is wired
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002';

@ApiTags('purchase-orders')
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.purchaseOrdersService.findAll(DEMO_ORG_ID, { status, vendorId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get PO detail' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrdersService.findOne(id, DEMO_ORG_ID);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get PO version history' })
  getVersionHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrdersService.getVersionHistory(id, DEMO_ORG_ID);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download PO as PDF' })
  async getPdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const po = await this.purchaseOrdersService.findOne(id, DEMO_ORG_ID);
    const pdf = await this.pdfService.generatePoPdf(po as any);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${po.number}.pdf"`);
    res.send(pdf);
  }

  @Post()
  @ApiOperation({ summary: 'Create a purchase order' })
  create(@Body() body: unknown) {
    const parsed = createPoSchema.parse(body);
    return this.purchaseOrdersService.create(DEMO_ORG_ID, DEMO_USER_ID, parsed);
  }

  @Post(':id/issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue a PO (send to vendor)' })
  issue(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrdersService.issue(id, DEMO_ORG_ID, DEMO_USER_ID);
  }

  @Post(':id/change-order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a change order (bumps version)' })
  changeOrder(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = changeOrderSchema.parse(body);
    return this.purchaseOrdersService.createChangeOrder(id, DEMO_ORG_ID, DEMO_USER_ID, parsed);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a PO' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrdersService.cancel(id, DEMO_ORG_ID);
  }
}
