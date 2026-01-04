import { Module } from '@nestjs/common';
import { VoiceAgentService } from './voice-agent.service';
import { VoiceAgentController } from './voice-agent.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VoiceAgentService],
  controllers: [VoiceAgentController],
  exports: [VoiceAgentService],
})
export class VoiceAgentModule {}
