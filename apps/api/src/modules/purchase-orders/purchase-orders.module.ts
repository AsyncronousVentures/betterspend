import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PdfService } from './pdf.service';

@Module({
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PdfService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
