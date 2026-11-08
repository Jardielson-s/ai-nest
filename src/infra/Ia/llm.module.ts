import { anthropic } from '@ai-sdk/anthropic';
import { AiModule } from '@nestjs/ai';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    AiModule.forRoot({
      isGlobal: true,
      models: {
        default: anthropic('claude-opus-5-5'),
      },
    }),
  ],
  exports: [AiModule],
})
export class LlmModule {}
