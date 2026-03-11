import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookEventService } from './webhook-event.service';
import { WebhookDeliveryProcessor } from './webhook-delivery.processor';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: 'webhook-delivery' })],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookEventService, WebhookDeliveryProcessor],
  exports: [WebhookEventService],
})
export class WebhooksModule {}
