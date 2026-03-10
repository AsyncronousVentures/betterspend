import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { vendorSchema } from '@betterspend/shared';

// Temporary: hardcoded org ID until auth is wired up
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all vendors' })
  findAll() {
    return this.vendorsService.findAll(DEMO_ORG_ID);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vendor by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vendorsService.findOne(id, DEMO_ORG_ID);
  }

  @Post()
  @ApiOperation({ summary: 'Create a vendor' })
  create(@Body() body: unknown) {
    const parsed = vendorSchema.parse(body);
    return this.vendorsService.create({
      organizationId: DEMO_ORG_ID,
      ...parsed,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vendor' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const parsed = vendorSchema.partial().parse(body);
    return this.vendorsService.update(id, DEMO_ORG_ID, parsed);
  }
}
