import {
  Controller, Get, Post, Patch, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RequisitionsService } from './requisitions.service';
import { createRequisitionSchema } from '@betterspend/shared';

// Temporary: hardcoded until auth is wired
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002';

@ApiTags('requisitions')
@Controller('requisitions')
export class RequisitionsController {
  constructor(private readonly requisitionsService: RequisitionsService) {}

  @Get()
  @ApiOperation({ summary: 'List requisitions' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.requisitionsService.findAll(DEMO_ORG_ID, { status, departmentId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get requisition detail' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.requisitionsService.findOne(id, DEMO_ORG_ID);
  }

  @Post()
  @ApiOperation({ summary: 'Create a requisition' })
  create(@Body() body: unknown) {
    const parsed = createRequisitionSchema.parse(body);
    return this.requisitionsService.create(DEMO_ORG_ID, DEMO_USER_ID, parsed);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft requisition' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = createRequisitionSchema.partial().parse(body);
    return this.requisitionsService.update(id, DEMO_ORG_ID, parsed);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit requisition for approval' })
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.requisitionsService.submit(id, DEMO_ORG_ID, DEMO_USER_ID);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a requisition' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.requisitionsService.cancel(id, DEMO_ORG_ID);
  }
}
