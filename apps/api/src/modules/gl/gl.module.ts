import { Global, Module } from '@nestjs/common';
import { GlMappingsService } from './gl-mappings.service';
import { GlExportService } from './gl-export.service';
import { GlController } from './gl.controller';

@Global()
@Module({
  controllers: [GlController],
  providers: [GlMappingsService, GlExportService],
  exports: [GlExportService],
})
export class GlModule {}
