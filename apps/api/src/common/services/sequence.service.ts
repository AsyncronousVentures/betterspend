import { Injectable, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { NUMBER_PREFIXES } from '@betterspend/shared';

type EntityType = 'requisition' | 'purchase_order' | 'goods_receipt' | 'invoice';

@Injectable()
export class SequenceService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async next(organizationId: string, entityType: EntityType): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = {
      requisition: NUMBER_PREFIXES.REQUISITION,
      purchase_order: NUMBER_PREFIXES.PURCHASE_ORDER,
      goods_receipt: NUMBER_PREFIXES.GOODS_RECEIPT,
      invoice: NUMBER_PREFIXES.INVOICE,
    }[entityType];

    const result = await this.db.transaction(async (tx) => {
      // Find existing sequence row and lock it to prevent concurrent gaps
      const existing = await tx.execute(sql`
        SELECT id, last_value FROM sequences
        WHERE organization_id = ${organizationId}
          AND entity_type = ${entityType}
          AND year = ${year}
        FOR UPDATE
      `);

      if ((existing as any[]).length > 0) {
        const row = (existing as any[])[0];
        const newValue = row.last_value + 1;
        await tx.execute(sql`
          UPDATE sequences SET last_value = ${newValue}, updated_at = now()
          WHERE id = ${row.id}
        `);
        return newValue;
      } else {
        await tx.execute(sql`
          INSERT INTO sequences (id, organization_id, entity_type, year, last_value, updated_at)
          VALUES (gen_random_uuid(), ${organizationId}, ${entityType}, ${year}, 1, now())
        `);
        return 1;
      }
    });

    const seq = String(result).padStart(4, '0');
    return `${prefix}-${year}-${seq}`;
  }
}
