import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReceivingService, CreateGrnInput } from './receiving.service';

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

@ApiTags('receiving')
@ApiBearerAuth()
@Controller('receiving')
export class ReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Get()
  @ApiOperation({ summary: 'List all goods receipts' })
  findAll() {
    return this.receivingService.findAll(DEMO_ORG_ID);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a GRN by ID' })
  findOne(@Param('id') id: string) {
    return this.receivingService.findOne(id, DEMO_ORG_ID);
  }

  @Post()
  @ApiOperation({ summary: 'Create a goods receipt (GRN)' })
  create(@Body() body: CreateGrnInput) {
    return this.receivingService.create(DEMO_ORG_ID, body);
  }
}
