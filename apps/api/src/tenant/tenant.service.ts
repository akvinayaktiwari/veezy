import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    // Check if tenant already exists
    const existing = await this.prisma.tenant.findUnique({
      where: { userId: createTenantDto.userId },
    });

    if (existing) {
      throw new ConflictException('Tenant already exists for this user');
    }

    return this.prisma.tenant.create({
      data: createTenantDto,
    });
  }

  async findByUserId(userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { userId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
