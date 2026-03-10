import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { MatchingService } from './matching.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, MatchingService],
  exports: [InvoicesService, MatchingService],
})
export class InvoicesModule {}
