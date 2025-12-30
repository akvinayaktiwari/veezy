import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(bookingData: {
    leadId: string;
    agentId: string;
    tenantId: string;
    scheduledAt: Date;
    expiresAt: Date;
    meetingToken: string;
    status: BookingStatus;
  }) {
    return this.prisma.booking.create({
      data: bookingData,
    });
  }

  async findByMeetingToken(meetingToken: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { meetingToken },
      include: {
        lead: true,
        agent: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with meeting token ${meetingToken} not found`);
    }

    const isExpired = new Date() > booking.expiresAt;

    return {
      ...booking,
      isExpired,
    };
  }

  async updateStatus(id: string, status: BookingStatus) {
    try {
      return await this.prisma.booking.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      throw new NotFoundException(`Booking with id ${id} not found`);
    }
  }
}
