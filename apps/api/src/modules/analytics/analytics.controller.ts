import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'High-level KPI summary' })
  kpis(@CurrentOrgId() orgId: string) {
    return this.analyticsService.kpis(orgId);
  }

  @Get('spend/by-vendor')
  @ApiOperation({ summary: 'Spend breakdown by vendor (approved invoices)' })
  spendByVendor(@CurrentOrgId() orgId: string) {
    return this.analyticsService.spendByVendor(orgId);
  }

  @Get('spend/by-department')
  @ApiOperation({ summary: 'Spend breakdown by department (active POs)' })
  spendByDepartment(@CurrentOrgId() orgId: string) {
    return this.analyticsService.spendByDepartment(orgId);
  }

  @Get('spend/monthly')
  @ApiOperation({ summary: 'Monthly spend trend (last 12 months)' })
  monthlySpend(@CurrentOrgId() orgId: string) {
    return this.analyticsService.monthlySpend(orgId);
  }

  @Get('invoice-aging')
  @ApiOperation({ summary: 'Invoice aging by due-date bucket' })
  invoiceAging(@CurrentOrgId() orgId: string) {
    return this.analyticsService.invoiceAging(orgId);
  }

  @Get('po-cycle-time')
  @ApiOperation({ summary: 'Average PO cycle time (draft → issued)' })
  poCycleTime(@CurrentOrgId() orgId: string) {
    return this.analyticsService.poCycleTime(orgId);
  }
}
