import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GlMappingsService, CreateGlMappingInput, UpdateGlMappingInput } from './gl-mappings.service';
import { GlExportService } from './gl-export.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';

@ApiTags('gl')
@Controller('gl')
export class GlController {
  constructor(
    private readonly glMappingsService: GlMappingsService,
    private readonly glExportService: GlExportService,
  ) {}

  // ── Mappings ───────────────────────────────────────────────────────────────

  @Get('mappings')
  @ApiOperation({ summary: 'List GL account mappings' })
  @ApiQuery({ name: 'targetSystem', required: false, enum: ['qbo', 'xero'] })
  findAllMappings(@CurrentOrgId() orgId: string, @Query('targetSystem') targetSystem?: string) {
    return this.glMappingsService.findAll(orgId, targetSystem);
  }

  @Get('mappings/:id')
  @ApiOperation({ summary: 'Get a GL mapping' })
  findOneMapping(@Param('id') id: string, @CurrentOrgId() orgId: string) {
    return this.glMappingsService.findOne(id, orgId);
  }

  @Post('mappings')
  @ApiOperation({ summary: 'Create a GL account mapping' })
  createMapping(@Body() body: CreateGlMappingInput, @CurrentOrgId() orgId: string) {
    return this.glMappingsService.create(orgId, body);
  }

  @Patch('mappings/:id')
  @ApiOperation({ summary: 'Update a GL mapping' })
  updateMapping(@Param('id') id: string, @Body() body: UpdateGlMappingInput, @CurrentOrgId() orgId: string) {
    return this.glMappingsService.update(id, orgId, body);
  }

  @Delete('mappings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a GL mapping' })
  removeMapping(@Param('id') id: string, @CurrentOrgId() orgId: string) {
    return this.glMappingsService.remove(id, orgId);
  }

  // ── Export Jobs ────────────────────────────────────────────────────────────

  @Get('export-jobs')
  @ApiOperation({ summary: 'List GL export jobs' })
  findAllJobs(@CurrentOrgId() orgId: string) {
    return this.glExportService.findAll(orgId);
  }

  @Get('export-jobs/invoice/:invoiceId')
  @ApiOperation({ summary: 'List GL export jobs for a specific invoice' })
  findJobsForInvoice(@Param('invoiceId') invoiceId: string) {
    return this.glExportService.findJobsForInvoice(invoiceId);
  }

  @Post('export-jobs/trigger/:invoiceId')
  @ApiOperation({ summary: 'Manually trigger GL export for an approved invoice' })
  @ApiQuery({ name: 'targetSystem', required: true, enum: ['qbo', 'xero'] })
  triggerExport(
    @Param('invoiceId') invoiceId: string,
    @CurrentOrgId() orgId: string,
    @Query('targetSystem') targetSystem: 'qbo' | 'xero' = 'qbo',
  ) {
    this.glExportService.enqueue(orgId, invoiceId, targetSystem);
    return { queued: true, invoiceId, targetSystem };
  }
}
