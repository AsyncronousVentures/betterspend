import { Controller, Get, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('purchase-orders/csv')
  @ApiOperation({ summary: 'Export purchase orders as CSV' })
  @ApiQuery({ name: 'status', required: false })
  async exportPOs(
    @CurrentOrgId() orgId: string,
    @Res() res: Response,
    @Query('status') status?: string,
  ) {
    const csv = await this.reportsService.exportPOs(orgId, status);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="purchase-orders.csv"');
    res.send(csv);
  }

  @Get('invoices/csv')
  @ApiOperation({ summary: 'Export invoices as CSV' })
  @ApiQuery({ name: 'status', required: false })
  async exportInvoices(
    @CurrentOrgId() orgId: string,
    @Res() res: Response,
    @Query('status') status?: string,
  ) {
    const csv = await this.reportsService.exportInvoices(orgId, status);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
    res.send(csv);
  }

  @Get('requisitions/csv')
  @ApiOperation({ summary: 'Export requisitions as CSV' })
  async exportRequisitions(@CurrentOrgId() orgId: string, @Res() res: Response) {
    const csv = await this.reportsService.exportRequisitions(orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="requisitions.csv"');
    res.send(csv);
  }

  @Get('spend-summary/csv')
  @ApiOperation({ summary: 'Export spend summary by vendor as CSV' })
  async exportSpendSummary(@CurrentOrgId() orgId: string, @Res() res: Response) {
    const csv = await this.reportsService.exportSpendSummary(orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="spend-summary.csv"');
    res.send(csv);
  }
}
