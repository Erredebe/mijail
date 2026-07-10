import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRoutingPolicyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  environment?: string;

  @IsString()
  providerId!: string;

  @IsString()
  primaryModelId!: string;

  @IsOptional()
  @IsString()
  fallbackModelId?: string;
}
