import { Module, Global } from '@nestjs/common';
import { SequenceService } from './sequence.service';

@Global()
@Module({
  providers: [SequenceService],
  exports: [SequenceService],
})
export class CommonServicesModule {}
