import { Module } from '@nestjs/common';
import { RecurringPoController } from './recurring-po.controller';
import { RecurringPoService } from './recurring-po.service';

@Module({
  controllers: [RecurringPoController],
  providers: [RecurringPoService],
  exports: [RecurringPoService],
})
export class RecurringPoModule {}
