import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  async findAllByTenantAndAgent(tenantId: string, agentId?: string) {
    const where: any = { tenantId };
    if (agentId) {
      where.agentId = agentId;
    }

    return this.prisma.lead.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        bookings: {
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStatsByTenantAndAgent(tenantId: string, agentId?: string) {
    const where: any = { tenantId };
    if (agentId) {
      where.agentId = agentId;
    }

    const leads = await this.prisma.lead.findMany({
      where,
      include: {
        bookings: {
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
      },
    });

    const total = leads.length;
    let upcoming = 0;
    let completed = 0;
    let pending = 0;

    const now = new Date();

    for (const lead of leads) {
      const latestBooking = lead.bookings[0];
      if (!latestBooking) continue;

      if (latestBooking.status === BookingStatus.CONFIRMED) {
        completed++;
      } else if (latestBooking.status === BookingStatus.PENDING) {
        if (new Date(latestBooking.scheduledAt) > now) {
          upcoming++;
        } else {
          pending++;
        }
      }
    }

    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      upcoming,
      completed,
      conversionRate,
    };
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.lead.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        bookings: {
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });
  }

  async updateBookingStatus(
    leadId: string,
    tenantId: string,
    status: BookingStatus,
  ) {
    // Verify the lead belongs to the tenant
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId,
      },
      include: {
        bookings: {
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!lead || lead.bookings.length === 0) {
      return null;
    }

    return this.prisma.booking.update({
      where: { id: lead.bookings[0].id },
      data: { status },
    });
  }

  async delete(id: string, tenantId: string) {
    // Verify the lead belongs to the tenant
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!lead) {
      return null;
    }

    return this.prisma.lead.delete({
      where: { id },
    });
  }
}
