import { IsOptional, IsString, IsUUID } from 'class-validator';

export class EndSessionDto {
  @IsUUID()
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  feedback?: string;
}
