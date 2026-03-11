import { Injectable, Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

export type WebhookEventType =
  | 'requisition.submitted'
  | 'requisition.approved'
  | 'requisition.rejected'
  | 'po.issued'
  | 'po.approved'
  | 'po.rejected'
  | 'po.cancelled'
  | 'grn.created'
  | 'invoice.matched'
  | 'invoice.exception'
  | 'invoice.approved'
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected';

@Injectable()
export class WebhookEventService {
  private readonly logger = new Logger(WebhookEventService.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  emit(organizationId: string, eventType: WebhookEventType, payload: Record<string, unknown>): void {
    // Fire-and-forget: do not await, never block the caller
    setImmediate(() => {
      this.webhooksService
        .dispatchEvent(organizationId, eventType, payload)
        .catch((err: unknown) =>
          this.logger.error(`Failed to dispatch webhook event ${eventType}: ${String(err)}`),
        );
    });
  }
}
