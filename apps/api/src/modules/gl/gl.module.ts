import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GlMappingsService } from './gl-mappings.service';
import { GlExportService } from './gl-export.service';
import { GlController } from './gl.controller';
import { GlExportProcessor } from './gl-export.processor';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: 'gl-export' })],
  controllers: [GlController],
  providers: [GlMappingsService, GlExportService, GlExportProcessor],
  exports: [GlExportService],
})
export class GlModule {}
