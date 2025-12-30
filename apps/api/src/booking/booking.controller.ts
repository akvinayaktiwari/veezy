import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingStatus } from '@prisma/client';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('meeting/:meetingToken')
  async findByMeetingToken(@Param('meetingToken') meetingToken: string) {
    return this.bookingService.findByMeetingToken(meetingToken);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingService.updateStatus(id, status);
  }
}
