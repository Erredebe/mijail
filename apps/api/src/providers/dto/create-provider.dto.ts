import { ProviderKind } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsString()
  @MinLength(2)
  provider!: string;

  @IsEnum(ProviderKind)
  kind!: ProviderKind;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  baseUrl?: string;

  @IsOptional()
  @IsString()
  apiKeyMasked?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
