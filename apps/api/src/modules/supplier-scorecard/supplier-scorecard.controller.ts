import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SupplierScorecardService } from './supplier-scorecard.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';

@ApiTags('supplier-scorecard')
@Controller('supplier-scorecard')
export class SupplierScorecardController {
  constructor(private readonly service: SupplierScorecardService) {}

  @Get()
  @ApiOperation({ summary: 'List all vendors with computed performance scores' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max vendors to return (default 50)' })
  list(
    @CurrentOrgId() orgId: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listScores(orgId, limit ? Math.min(Number(limit), 200) : 50);
  }

  @Get(':vendorId')
  @ApiOperation({ summary: 'Detailed scorecard for a single vendor' })
  detail(
    @CurrentOrgId() orgId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.service.getDetail(orgId, vendorId);
  }
}
