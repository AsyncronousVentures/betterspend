import { Module, Global } from '@nestjs/common';
import { SequenceService } from './sequence.service';
import { MailService } from '../mail/mail.service';

@Global()
@Module({
  providers: [SequenceService, MailService],
  exports: [SequenceService, MailService],
})
export class CommonServicesModule {}
