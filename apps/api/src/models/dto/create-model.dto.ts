import { ModelCapability } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateModelDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsString()
  @MinLength(2)
  externalModelId!: string;

  @IsArray()
  @IsEnum(ModelCapability, { each: true })
  capabilities!: ModelCapability[];

  @IsOptional()
  @IsInt()
  contextWindow?: number;

  @IsOptional()
  @IsBoolean()
  supportsStructuredIo?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsString()
  providerConnectionId!: string;
}
