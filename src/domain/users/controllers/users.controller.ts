import { Body, Controller, Injectable, Post } from '@nestjs/common';
import { UsersService } from '../services/users.service';

@Controller('users')
@Injectable()
export class UsersController {
  constructor(protected readonly usersService: UsersService) {}

  @Post('/question')
  async queston(@Body() body: { question: string }) {
    return this.usersService.question(body.question);
  }
}
