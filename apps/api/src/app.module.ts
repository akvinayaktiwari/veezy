import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { AgentModule } from './agent/agent.module';
import { LeadModule } from './lead/lead.module';
import { BookingModule } from './booking/booking.module';
import { VoiceAgentModule } from './voice-agent/voice-agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes env variables available everywhere
    }),
    PrismaModule,
    TenantModule,
    AgentModule,
    LeadModule,
    BookingModule,
    VoiceAgentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
