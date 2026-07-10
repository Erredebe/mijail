import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SessionMessageDto {
  @IsString()
  role!: 'system' | 'user' | 'assistant';

  @IsString()
  content!: string;
}

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionMessageDto)
  messages!: SessionMessageDto[];
}
