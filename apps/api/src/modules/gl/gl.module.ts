import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GlMappingsService } from './gl-mappings.service';
import { GlExportService } from './gl-export.service';
import { GlController } from './gl.controller';
import { GlExportProcessor } from './gl-export.processor';
import { OAuthService } from './oauth.service';
import { SettingsModule } from '../settings/settings.module';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: 'gl-export' }),
    SettingsModule,
  ],
  controllers: [GlController],
  providers: [GlMappingsService, GlExportService, GlExportProcessor, OAuthService],
  exports: [GlExportService, OAuthService],
})
export class GlModule {}
