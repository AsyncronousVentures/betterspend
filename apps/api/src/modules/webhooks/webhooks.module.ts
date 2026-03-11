import { Global, Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookEventService } from './webhook-event.service';

@Global()
@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookEventService],
  exports: [WebhookEventService],
})
export class WebhooksModule {}
