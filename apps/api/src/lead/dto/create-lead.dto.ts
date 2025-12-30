import { IsString, IsEmail, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';

export class CreateLeadDto {
  @IsUUID()
  @IsNotEmpty()
  agentId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;
}
