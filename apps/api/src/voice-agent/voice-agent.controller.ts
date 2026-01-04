import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VoiceAgentService } from './voice-agent.service';
import { StartSessionDto } from './dto/start-session.dto';
import { EndSessionDto } from './dto/end-session.dto';

@Controller('voice-agent')
export class VoiceAgentController {
  constructor(private readonly voiceAgentService: VoiceAgentService) {}

  @Post('sessions/start')
  @HttpCode(HttpStatus.CREATED)
  async startSession(@Body() dto: StartSessionDto) {
    // Start new voice session for booking
    return await this.voiceAgentService.startVoiceSession(dto.bookingId);
  }

  @Get('sessions/booking/:bookingId/active')
  @HttpCode(HttpStatus.OK)
  async getActiveSessionByBooking(@Param('bookingId') bookingId: string) {
    // Get active session for a booking (if exists)
    return await this.voiceAgentService.getActiveSessionByBooking(bookingId);
  }

  @Get('sessions/:sessionId/status')
  @HttpCode(HttpStatus.OK)
  async getSessionStatus(@Param('sessionId') sessionId: string) {
    // Get current session status and partial transcript
    return await this.voiceAgentService.getSessionStatus(sessionId);
  }

  @Post('sessions/:sessionId/end')
  @HttpCode(HttpStatus.OK)
  async endSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: EndSessionDto,
  ) {
    // End active voice session gracefully
    return await this.voiceAgentService.endVoiceSession(sessionId);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    // Check if Python voice agent is reachable
    const pythonServiceAvailable =
      await this.voiceAgentService.checkPythonHealth();

    return {
      status: pythonServiceAvailable ? 'ok' : 'degraded',
      pythonServiceAvailable,
    };
  }
}
