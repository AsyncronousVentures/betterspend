import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue(
      { name: 'gl-export' },
      { name: 'webhook-delivery' },
      { name: 'ocr' },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
