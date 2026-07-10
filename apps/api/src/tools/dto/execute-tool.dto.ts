import { IsOptional, IsString } from 'class-validator';

export class ExecuteToolDto {
  @IsOptional()
  payload?: unknown;

  @IsOptional()
  @IsString()
  apiKey?: string;
}
