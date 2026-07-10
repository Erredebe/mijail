import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ExecuteChatDto } from './dto/execute-chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('executions')
  listExecutions() {
    return this.chatService.listExecutions();
  }

  @Get('sessions')
  listSessions() {
    return this.chatService.listSessions();
  }

  @Post('sessions')
  saveSession(@Body() input: CreateSessionDto) {
    return this.chatService.saveSession(input);
  }

  @Post('execute')
  execute(@Body() input: ExecuteChatDto) {
    return this.chatService.execute(input);
  }

  @Post('stream')
  stream(@Body() input: ExecuteChatDto, @Res() response: Response) {
    return this.chatService.stream(input, response);
  }
}
