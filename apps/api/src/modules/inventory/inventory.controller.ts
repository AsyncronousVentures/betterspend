import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory items' })
  @ApiQuery({ name: 'lowStockOnly', required: false })
  async findAll(
    @CurrentOrgId() orgId: string,
    @Query('lowStockOnly') lowStockOnly?: string,
  ) {
    const items = await this.inventoryService.list(orgId);
    if (lowStockOnly === 'true') {
      return items.filter((i) => i.stockStatus === 'low_stock' || i.stockStatus === 'out_of_stock');
    }
    return items;
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low-stock items' })
  getLowStock(@CurrentOrgId() orgId: string) {
    return this.inventoryService.getLowStockItems(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create an inventory item' })
  create(@Body() body: unknown, @CurrentOrgId() orgId: string) {
    const data = body as any;
    return this.inventoryService.create(orgId, {
      sku: data.sku,
      name: data.name,
      description: data.description,
      unit: data.unit,
      reorderPoint: data.reorderPoint != null ? Number(data.reorderPoint) : undefined,
      reorderQuantity: data.reorderQuantity != null ? Number(data.reorderQuantity) : undefined,
      location: data.location,
      metadata: data.metadata,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an inventory item with recent movements' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOrgId() orgId: string) {
    return this.inventoryService.get(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an inventory item' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @CurrentOrgId() orgId: string,
  ) {
    const data = body as any;
    return this.inventoryService.update(orgId, id, {
      name: data.name,
      description: data.description,
      unit: data.unit,
      reorderPoint: data.reorderPoint !== undefined ? (data.reorderPoint != null ? Number(data.reorderPoint) : null) : undefined,
      reorderQuantity: data.reorderQuantity !== undefined ? (data.reorderQuantity != null ? Number(data.reorderQuantity) : null) : undefined,
      location: data.location,
      metadata: data.metadata,
    });
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Manually adjust inventory quantity' })
  adjust(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { quantity: number; notes?: string },
    @CurrentOrgId() orgId: string,
  ) {
    return this.inventoryService.adjust(orgId, id, {
      quantity: Number(body.quantity),
      notes: body.notes,
    });
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Get movement history for an inventory item' })
  movements(@Param('id', ParseUUIDPipe) id: string, @CurrentOrgId() orgId: string) {
    return this.inventoryService.movements(orgId, id);
  }
}
