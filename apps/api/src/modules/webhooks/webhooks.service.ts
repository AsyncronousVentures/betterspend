import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { createHmac, randomBytes } from 'crypto';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { webhookEndpoints, webhookDeliveries } from '@betterspend/db';

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [0, 30_000, 120_000, 600_000, 3_600_000]; // 0s, 30s, 2m, 10m, 1h

export interface CreateWebhookEndpointInput {
  url: string;
  events: string[];
  secret?: string;
}

export interface UpdateWebhookEndpointInput {
  url?: string;
  events?: string[];
  isActive?: boolean;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async findAll(organizationId: string) {
    return this.db.query.webhookEndpoints.findMany({
      where: (w, { eq }) => eq(w.organizationId, organizationId),
      orderBy: (w, { desc }) => desc(w.createdAt),
    });
  }

  async findOne(id: string, organizationId: string) {
    const endpoint = await this.db.query.webhookEndpoints.findFirst({
      where: (w, { and, eq }) => and(eq(w.id, id), eq(w.organizationId, organizationId)),
      with: { deliveries: { orderBy: (d, { desc }) => desc(d.createdAt), limit: 20 } },
    });
    if (!endpoint) throw new NotFoundException(`Webhook endpoint ${id} not found`);
    return endpoint;
  }

  async create(organizationId: string, input: CreateWebhookEndpointInput) {
    const secret = input.secret ?? randomBytes(32).toString('hex');
    const [endpoint] = await this.db
      .insert(webhookEndpoints)
      .values({ organizationId, url: input.url, events: input.events, secret })
      .returning();
    return endpoint;
  }

  async update(id: string, organizationId: string, input: UpdateWebhookEndpointInput) {
    await this.findOne(id, organizationId);
    const [updated] = await this.db
      .update(webhookEndpoints)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.organizationId, organizationId)))
      .returning();
    return updated;
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.db
      .delete(webhookEndpoints)
      .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.organizationId, organizationId)));
  }

  async listDeliveries(endpointId: string, organizationId: string) {
    await this.findOne(endpointId, organizationId); // validates ownership
    return this.db.query.webhookDeliveries.findMany({
      where: (d, { eq }) => eq(d.webhookEndpointId, endpointId),
      orderBy: (d, { desc }) => desc(d.createdAt),
      limit: 100,
    });
  }

  // ── Delivery ───────────────────────────────────────────────────────────────

  async dispatchEvent(
    organizationId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const endpoints = await this.db.query.webhookEndpoints.findMany({
      where: (w, { and, eq }) =>
        and(eq(w.organizationId, organizationId), eq(w.isActive, true)),
    });

    const matched = endpoints.filter(
      (ep) => ep.events.length === 0 || ep.events.includes(eventType),
    );

    await Promise.all(
      matched.map((ep) => this.deliverToEndpoint(ep.id, ep.url, ep.secret, eventType, payload)),
    );
  }

  private async deliverToEndpoint(
    endpointId: string,
    url: string,
    secret: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const body = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const signature = createHmac('sha256', secret).update(body).digest('hex');

    // Create delivery record
    const [delivery] = await this.db
      .insert(webhookDeliveries)
      .values({
        webhookEndpointId: endpointId,
        eventType,
        payload: payload as Record<string, unknown>,
        status: 'pending',
        attempts: 0,
      })
      .returning();

    await this.attemptDelivery(delivery.id, url, body, signature);
  }

  private async attemptDelivery(
    deliveryId: string,
    url: string,
    body: string,
    signature: string,
  ): Promise<void> {
    const delivery = await this.db.query.webhookDeliveries.findFirst({
      where: (d, { eq }) => eq(d.id, deliveryId),
    });
    if (!delivery) return;

    const attempt = (delivery.attempts ?? 0) + 1;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BetterSpend-Signature': `sha256=${signature}`,
          'X-BetterSpend-Event': delivery.eventType,
          'X-BetterSpend-Delivery': deliveryId,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      const responseBody = await response.text().catch(() => '');

      if (response.ok) {
        await this.db
          .update(webhookDeliveries)
          .set({
            status: 'delivered',
            attempts: attempt,
            responseStatus: response.status,
            responseBody,
            deliveredAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(webhookDeliveries.id, deliveryId));
        return;
      }

      // Non-2xx: schedule retry
      await this.scheduleRetryOrFail(deliveryId, attempt, response.status, responseBody);
    } catch (err: unknown) {
      this.logger.warn(`Webhook delivery ${deliveryId} attempt ${attempt} failed: ${String(err)}`);
      await this.scheduleRetryOrFail(deliveryId, attempt, null, String(err));
    }
  }

  private async scheduleRetryOrFail(
    deliveryId: string,
    attempt: number,
    responseStatus: number | null,
    responseBody: string,
  ): Promise<void> {
    if (attempt >= MAX_ATTEMPTS) {
      await this.db
        .update(webhookDeliveries)
        .set({
          status: 'failed',
          attempts: attempt,
          responseStatus,
          responseBody,
          updatedAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, deliveryId));
      this.logger.error(`Webhook delivery ${deliveryId} permanently failed after ${attempt} attempts`);
      return;
    }

    const delayMs = RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
    const nextRetryAt = new Date(Date.now() + delayMs);

    await this.db
      .update(webhookDeliveries)
      .set({
        status: 'retrying',
        attempts: attempt,
        responseStatus,
        responseBody,
        nextRetryAt,
        updatedAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, deliveryId));

    // Schedule the retry
    setTimeout(() => {
      const delivery = this.db.query.webhookDeliveries
        .findFirst({ where: (d, { eq }) => eq(d.id, deliveryId) })
        .then(async (d) => {
          if (!d || d.status !== 'retrying') return;
          const endpoint = await this.db.query.webhookEndpoints.findFirst({
            where: (w, { eq }) => eq(w.id, d.webhookEndpointId),
          });
          if (!endpoint) return;

          const body = JSON.stringify({
            event: d.eventType,
            timestamp: new Date().toISOString(),
            data: d.payload,
          });
          const signature = createHmac('sha256', endpoint.secret).update(body).digest('hex');
          await this.attemptDelivery(deliveryId, endpoint.url, body, signature);
        })
        .catch((err: unknown) =>
          this.logger.error(`Retry scheduling error for ${deliveryId}: ${String(err)}`),
        );
      void delivery;
    }, delayMs);
  }
}
