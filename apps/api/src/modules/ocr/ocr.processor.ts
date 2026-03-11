import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OcrService } from './ocr.service';

export interface OcrJobData {
  jobId: string;
}

@Processor('ocr')
export class OcrProcessor extends WorkerHost {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(private readonly ocrService: OcrService) {
    super();
  }

  async process(job: Job<OcrJobData>): Promise<void> {
    this.logger.log(`Processing OCR extraction for job ${job.data.jobId}`);
    await this.ocrService.runExtractionById(job.data.jobId);
  }
}
