import {
  Controller, Get, Post, Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { OcrService } from './ocr.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';

interface SubmitOcrJobDto {
  filename: string;
  contentType: string;
  /** In production this is the MinIO object key returned after upload.
   *  For now the client sends the key it receives from a future presigned-URL upload flow. */
  storageKey: string;
}

@ApiTags('ocr')
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'List OCR jobs for this org' })
  findAll(@CurrentOrgId() orgId: string) {
    return this.ocrService.findAll(orgId);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get OCR job status and extracted data' })
  findOne(@Param('id') id: string, @CurrentOrgId() orgId: string) {
    return this.ocrService.findJob(id, orgId);
  }

  @Post('jobs')
  @ApiOperation({
    summary: 'Submit a document for OCR extraction',
    description:
      'Creates an OCR job and runs extraction asynchronously. Poll GET /ocr/jobs/:id until status = "done".',
  })
  createJob(@Body() body: SubmitOcrJobDto, @CurrentOrgId() orgId: string, @CurrentUserId() userId: string) {
    return this.ocrService.createJob({
      organizationId: orgId,
      uploadedBy: userId,
      filename: body.filename,
      contentType: body.contentType,
      storageKey: body.storageKey,
    });
  }

  @Post('jobs/:id/link/:invoiceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Link a completed OCR job to an invoice' })
  linkToInvoice(@Param('id') id: string, @Param('invoiceId') invoiceId: string) {
    return this.ocrService.linkToInvoice(id, invoiceId);
  }
}
