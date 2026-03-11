import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { ocrJobs } from '@betterspend/db';

export interface OcrExtractedLine {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  glAccount: string | null;
}

export interface OcrExtractedData {
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;        // ISO date string
  dueDate: string | null;
  currency: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  lines: OcrExtractedLine[];
}

export interface OcrConfidence {
  vendorName: number;
  invoiceNumber: number;
  invoiceDate: number;
  dueDate: number;
  totalAmount: number;
  lines: number;
  overall: number;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async createJob(input: {
    organizationId: string;
    uploadedBy: string;
    filename: string;
    contentType: string;
    storageKey: string;
  }) {
    const [job] = await this.db
      .insert(ocrJobs)
      .values({ ...input, status: 'pending' })
      .returning();

    // Fire-and-forget extraction
    setImmediate(() => {
      this.runExtraction(job.id).catch((err: unknown) =>
        this.logger.error(`OCR extraction failed for job ${job.id}: ${String(err)}`),
      );
    });

    return job;
  }

  async findJob(id: string, organizationId: string) {
    const job = await this.db.query.ocrJobs.findFirst({
      where: (j, { and, eq }) => and(eq(j.id, id), eq(j.organizationId, organizationId)),
    });
    if (!job) throw new NotFoundException(`OCR job ${id} not found`);
    return job;
  }

  async findAll(organizationId: string) {
    return this.db.query.ocrJobs.findMany({
      where: (j, { eq }) => eq(j.organizationId, organizationId),
      orderBy: (j, { desc }) => desc(j.createdAt),
      limit: 50,
    });
  }

  async linkToInvoice(jobId: string, invoiceId: string) {
    await this.db.update(ocrJobs).set({ invoiceId, updatedAt: new Date() }).where(eq(ocrJobs.id, jobId));
  }

  /**
   * Stub: In production this calls Claude Vision API or GPT-4V.
   * Returns a structured extraction result with confidence scores.
   * Replace the body of this method with the real API call when OAuth/keys are configured.
   */
  private async runExtraction(jobId: string): Promise<void> {
    await this.db
      .update(ocrJobs)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(ocrJobs.id, jobId));

    try {
      // === STUB: Replace with real Vision API call ===
      // const fileBuffer = await minioClient.getObject(storageKey);
      // const response = await anthropic.messages.create({ model: 'claude-opus-4-6', ... });
      // const extracted = parseExtractionResponse(response);

      const extracted: OcrExtractedData = {
        vendorName: null,
        invoiceNumber: null,
        invoiceDate: null,
        dueDate: null,
        currency: 'USD',
        subtotal: null,
        taxAmount: null,
        totalAmount: null,
        lines: [],
      };

      const confidence: OcrConfidence = {
        vendorName: 0,
        invoiceNumber: 0,
        invoiceDate: 0,
        dueDate: 0,
        totalAmount: 0,
        lines: 0,
        overall: 0,
      };
      // === END STUB ===

      await this.db
        .update(ocrJobs)
        .set({
          status: 'done',
          extractedData: extracted as unknown as Record<string, unknown>,
          confidence: confidence as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(ocrJobs.id, jobId));
    } catch (err: unknown) {
      await this.db
        .update(ocrJobs)
        .set({ status: 'failed', errorMessage: String(err), updatedAt: new Date() })
        .where(eq(ocrJobs.id, jobId));
      throw err;
    }
  }
}
