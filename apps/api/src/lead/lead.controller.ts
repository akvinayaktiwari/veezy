import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  Patch,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { LeadService } from './lead.service';
import { BookingStatus } from '@prisma/client';

@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Get()
  async findAll(
    @Query('tenantId') tenantId: string,
    @Query('agentId') agentId?: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    return this.leadService.findAllByTenantAndAgent(tenantId, agentId);
  }

  @Get('stats')
  async getStats(
    @Query('tenantId') tenantId: string,
    @Query('agentId') agentId?: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    return this.leadService.getStatsByTenantAndAgent(tenantId, agentId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const lead = await this.leadService.findOne(id, tenantId);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body('status') status: BookingStatus,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    if (!status || !Object.values(BookingStatus).includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    const result = await this.leadService.updateBookingStatus(id, tenantId, status);
    if (!result) {
      throw new NotFoundException('Lead or booking not found');
    }
    return result;
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const result = await this.leadService.delete(id, tenantId);
    if (!result) {
      throw new NotFoundException('Lead not found');
    }
    return { success: true };
  }
}
