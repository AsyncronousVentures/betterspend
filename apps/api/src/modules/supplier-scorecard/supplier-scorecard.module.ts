import { Module } from '@nestjs/common';
import { SupplierScorecardController } from './supplier-scorecard.controller';
import { SupplierScorecardService } from './supplier-scorecard.service';

@Module({
  controllers: [SupplierScorecardController],
  providers: [SupplierScorecardService],
})
export class SupplierScorecardModule {}
