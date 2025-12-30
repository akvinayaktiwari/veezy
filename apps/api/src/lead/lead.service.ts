import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingService } from '../booking/booking.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { BookingStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingService: BookingService,
  ) {}

  async createWithBooking(createLeadDto: CreateLeadDto) {
    const { agentId, name, email, scheduledAt } = createLeadDto;

    // Get agent to retrieve linkExpiryHours and tenantId
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`);
    }

    // Create lead
    const lead = await this.prisma.lead.create({
      data: {
        agentId,
        tenantId: agent.tenantId,
        name,
        email,
      },
    });

    this.logger.log(`Lead created: ${lead.id} for agent ${agentId}`);

    // Calculate expiry time
    const scheduledDate = new Date(scheduledAt);
    const expiresAt = new Date(scheduledDate.getTime() + agent.linkExpiryHours * 60 * 60 * 1000);

    // Generate unique meeting token
    const meetingToken = randomUUID();

    // Create booking
    const booking = await this.bookingService.create({
      leadId: lead.id,
      agentId: agent.id,
      tenantId: agent.tenantId,
      scheduledAt: scheduledDate,
      expiresAt,
      meetingToken,
      status: BookingStatus.PENDING,
    });

    this.logger.log(`Booking created: ${booking.id} with meeting token ${meetingToken}`);

    return {
      lead,
      booking,
      meetingToken,
    };
  }

  async findAll(tenantId: string, agentId?: string) {
    const where: any = { tenantId };
    
    if (agentId) {
      where.agentId = agentId;
    }

    return this.prisma.lead.findMany({
      where,
      include: {
        bookings: true,
        agent: {
          select: {
            id: true,
            name: true,
            publicLink: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        bookings: true,
        agent: {
          select: {
            id: true,
            name: true,
            publicLink: true,
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with id ${id} not found`);
    }

    return lead;
  }

  async getStats(tenantId: string) {
    const now = new Date();

    // Total leads count
    const totalLeads = await this.prisma.lead.count({
      where: { tenantId },
    });

    // Get all bookings for this tenant
    const bookings = await this.prisma.booking.findMany({
      where: { tenantId },
      select: {
        status: true,
        scheduledAt: true,
        expiresAt: true,
      },
    });

    // Count by status
    const upcoming = bookings.filter(
      (b) => b.status === BookingStatus.PENDING && b.scheduledAt > now
    ).length;

    const completed = bookings.filter(
      (b) => b.status === BookingStatus.COMPLETED
    ).length;

    const expired = bookings.filter(
      (b) => b.expiresAt < now || b.status === BookingStatus.EXPIRED
    ).length;

    return {
      totalLeads,
      upcoming,
      completed,
      expired,
    };
  }
}
