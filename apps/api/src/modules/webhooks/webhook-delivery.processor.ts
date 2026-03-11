import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebhooksService } from './webhooks.service';

export interface WebhookDispatchJobData {
  organizationId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

@Processor('webhook-delivery')
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  constructor(private readonly webhooksService: WebhooksService) {
    super();
  }

  async process(job: Job<WebhookDispatchJobData>): Promise<void> {
    const { organizationId, eventType, payload } = job.data;
    this.logger.log(`Processing webhook dispatch for event ${eventType} (org: ${organizationId})`);
    await this.webhooksService.dispatchEvent(organizationId, eventType, payload);
  }
}
