import { Module } from '@nestjs/common';
import { PunchoutService } from './punchout.service';
import { PunchoutController } from './punchout.controller';

@Module({
  controllers: [PunchoutController],
  providers: [PunchoutService],
  exports: [PunchoutService],
})
export class PunchoutModule {}
