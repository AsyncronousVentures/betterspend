import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReceivingService, CreateGrnInput } from './receiving.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';

@ApiTags('receiving')
@ApiBearerAuth()
@Controller('receiving')
export class ReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Get()
  @ApiOperation({ summary: 'List all goods receipts' })
  findAll(@CurrentOrgId() orgId: string) {
    return this.receivingService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a GRN by ID' })
  findOne(@Param('id') id: string, @CurrentOrgId() orgId: string) {
    return this.receivingService.findOne(id, orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a goods receipt (GRN)' })
  create(@Body() body: CreateGrnInput, @CurrentOrgId() orgId: string) {
    return this.receivingService.create(orgId, body);
  }
}
