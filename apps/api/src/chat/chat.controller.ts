import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ExecuteChatDto } from './dto/execute-chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('executions')
  listExecutions() {
    return this.chatService.listExecutions();
  }

  @Post('execute')
  execute(@Body() input: ExecuteChatDto) {
    return this.chatService.execute(input);
  }
}
