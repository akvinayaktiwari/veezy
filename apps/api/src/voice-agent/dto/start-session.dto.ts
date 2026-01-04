import { IsString, IsUUID } from 'class-validator';

export class StartSessionDto {
  @IsUUID()
  @IsString()
  bookingId: string;
}
