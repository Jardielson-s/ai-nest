import { Module } from '@nestjs/common';
import { LlmModule } from './Ia/llm.module';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail/mail.service';
import { MailTools } from './Ia/tools/mail.tool';

@Module({
  imports: [ConfigModule, LlmModule],
  providers: [MailService, MailTools],
  exports: [LlmModule, MailService, MailTools],
})
export class InfraModule {}
