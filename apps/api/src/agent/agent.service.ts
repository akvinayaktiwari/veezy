import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(private prisma: PrismaService) {}

  async create(createAgentDto: CreateAgentDto) {
    try {
      const agent = await this.prisma.agent.create({
        data: {
          ...createAgentDto,
          publicLink: randomUUID(), // Generate unique public link
        },
      });
      
      this.logger.log(`Agent created: ${agent.id} for tenant: ${agent.tenantId}`);
      return agent;
    } catch (error) {
      this.logger.error(`Failed to create agent: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(tenantId: string) {
    try {
      return await this.prisma.agent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find agents for tenant ${tenantId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      return agent;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find agent ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByPublicLink(publicLink: string) {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { publicLink },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with public link ${publicLink} not found`);
      }

      return agent;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find agent by public link ${publicLink}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateAgentDto: UpdateAgentDto) {
    try {
      // Check if agent exists
      await this.findOne(id);

      const agent = await this.prisma.agent.update({
        where: { id },
        data: updateAgentDto,
      });

      this.logger.log(`Agent updated: ${id}`);
      return agent;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update agent ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Check if agent exists
      await this.findOne(id);

      await this.prisma.agent.delete({
        where: { id },
      });

      this.logger.log(`Agent deleted: ${id}`);
      return { message: `Agent ${id} successfully deleted` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete agent ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async findByTenantId(tenantId: string) {
    return this.findAll(tenantId);
  }
}
