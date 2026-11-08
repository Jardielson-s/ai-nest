import { Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';
import { anthropic } from '@ai-sdk/anthropic';
import { InfraModule } from './infra/infra.module';
import { UsersModule } from './domain/users/users.module';

@Module({
  imports: [
    // AiModule.forRoot({
    //   isGlobal: true,
    //   models: {
    //     default: anthropic('claude-opus-5-5'),
    //     fast: {
    //       model: anthropic('claude-opus-5-5'),
    //       fallback: 'default',
    //     },
    //   },
    //   defaults: { timeout: '30s', retry: { attempts: 3 } },
    // }),
    InfraModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
