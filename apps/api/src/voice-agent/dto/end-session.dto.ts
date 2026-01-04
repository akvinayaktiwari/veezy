import { IsOptional, IsString } from 'class-validator';

export class EndSessionDto {
  @IsOptional()
  @IsString()
  feedback?: string;
}
