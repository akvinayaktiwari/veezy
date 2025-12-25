import { Controller, Get, Query } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  async findAll(@Query('tenantId') tenantId?: string) {
    if (tenantId) {
      return this.agentService.findByTenantId(tenantId);
    }
    return this.agentService.findAll();
  }
}
