import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
