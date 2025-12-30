import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateAgentDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  knowledge: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(168)
  linkExpiryHours?: number = 24;
}
