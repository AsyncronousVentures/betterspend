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
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all vendors' })
  findAll(@CurrentOrgId() orgId: string) {
    return this.vendorsService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vendor by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOrgId() orgId: string) {
    return this.vendorsService.findOne(id, orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a vendor' })
  create(@Body() body: unknown, @CurrentOrgId() orgId: string) {
    const parsed = vendorSchema.parse(body);
    return this.vendorsService.create({
      organizationId: orgId,
      ...parsed,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vendor' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @CurrentOrgId() orgId: string,
  ) {
    const parsed = vendorSchema.partial().parse(body);
    return this.vendorsService.update(id, orgId, parsed);
  }
}
