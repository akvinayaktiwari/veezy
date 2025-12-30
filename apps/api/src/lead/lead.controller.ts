import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadService.createWithBooking(createLeadDto);
  }

  @Get()
  async findAll(
    @Query('tenantId') tenantId: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.leadService.findAll(tenantId, agentId);
  }

  @Get('stats')
  async getStats(@Query('tenantId') tenantId: string) {
    return this.leadService.getStats(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.leadService.findOne(id);
  }
}
