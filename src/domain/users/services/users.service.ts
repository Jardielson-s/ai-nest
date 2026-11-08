import { Injectable } from '@nestjs/common';
import { AiService } from '@nestjs/ai';
import { UserRequest } from '../dto/request.dto';

@Injectable()
export class UsersService {
  constructor(protected readonly aiService: AiService) {}

  async question(question: string): Promise<any> {
    const { object } = await this.aiService.generateObject({
      label: 'user',
      schema: UserRequest,
      schemaName: 'userRequest',
      instructions: 'Answer any user question',
      prompt: question,
      tools: ['send-email', 'send-email-pdf', 'make-pdf'],
    });
    return object;
  }
}
