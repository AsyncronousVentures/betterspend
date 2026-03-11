import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GlExportService, GlTargetSystem } from './gl-export.service';

export interface GlAnyJobData {
  // present for both process-export and retry-export jobs
  organizationId: string;
  invoiceId: string;
  targetSystem: GlTargetSystem;
  // present only for retry-export jobs
  jobId?: string;
}

@Processor('gl-export')
export class GlExportProcessor extends WorkerHost {
  private readonly logger = new Logger(GlExportProcessor.name);

  constructor(private readonly glExportService: GlExportService) {
    super();
  }

  async process(job: Job<GlAnyJobData>): Promise<void> {
    const { organizationId, invoiceId, targetSystem, jobId } = job.data;

    if (job.name === 'retry-export' && jobId) {
      this.logger.log(`Processing GL retry job ${jobId} for invoice ${invoiceId}`);
      await this.glExportService.processExportForJob(jobId, organizationId, invoiceId, targetSystem);
    } else {
      this.logger.log(`Processing GL export job for invoice ${invoiceId} -> ${targetSystem}`);
      await this.glExportService.processExport(organizationId, invoiceId, targetSystem);
    }
  }
}
