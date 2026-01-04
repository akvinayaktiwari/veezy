import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PythonSessionResponse,
  VoiceSessionStatus,
  VoiceSessionEnd,
  PythonHealthResponse,
} from './interfaces/voice-session.interface';

@Injectable()
export class VoiceAgentService {
  private readonly logger = new Logger(VoiceAgentService.name);
  private readonly pythonServiceUrl: string;

  constructor(private readonly prisma: PrismaService) {
    this.pythonServiceUrl =
      process.env.PYTHON_VOICE_AGENT_URL || 'http://localhost:8000';
    this.logger.log(`Python Voice Agent URL: ${this.pythonServiceUrl}`);
  }

  async startVoiceSession(bookingId: string) {
    // Fetch booking with agent and lead details from database
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        agent: true,
        lead: true,
        voiceSession: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or expired');
    }

    if (booking.expiresAt < new Date()) {
      throw new NotFoundException('Booking not found or expired');
    }

    if (booking.voiceSession) {
      throw new ConflictException('Voice session already active for this booking');
    }

    const roomName = `call_${bookingId}_${Date.now()}`;
    const agentName = booking.agent.name;
    const agentKnowledge = booking.agent.knowledge || 'You are a helpful assistant';

    try {
      // Call Python service POST /sessions/start
      const response = await fetch(`${this.pythonServiceUrl}/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: agentName,
          agent_knowledge: agentKnowledge,
          room_name: roomName,
        }),
      });

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Python voice agent service unavailable. Please try again.',
        );
      }

      const data: PythonSessionResponse = await response.json();

      // Create VoiceSession record in database
      const voiceSession = await this.prisma.voiceSession.create({
        data: {
          bookingId: bookingId,
          livekitRoomName: data.room_name,
          sessionId: data.session_id,
          status: 'active',
          metadata: {
            agentName,
            leadName: booking.lead.name,
            leadEmail: booking.lead.email,
          },
        },
      });

      this.logger.log(
        `Voice session started: booking=${bookingId}, agent=${booking.agent.id}, room=${roomName}`,
      );

      // Return room token and URL for frontend
      return {
        roomToken: data.participant_token,
        roomUrl: data.room_name,
        sessionId: voiceSession.id,
        roomName: data.room_name,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Failed to start voice session: ${error.message}`);
      throw new InternalServerErrorException('Failed to start voice session. Check logs.');
    }
  }

  async getSessionStatus(sessionId: string) {
    // Find VoiceSession by sessionId in database
    const voiceSession = await this.prisma.voiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!voiceSession) {
      throw new NotFoundException('Voice session not found');
    }

    try {
      // Call Python service GET /sessions/{session_id}/status
      const response = await fetch(
        `${this.pythonServiceUrl}/sessions/${voiceSession.sessionId}/status`,
      );

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Python voice agent service unavailable. Please try again.',
        );
      }

      const data: VoiceSessionStatus = await response.json();

      // Return status and partial transcript
      return {
        active: data.active,
        duration: data.duration_seconds,
        transcript: data.partial_transcript,
        status: voiceSession.status,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Failed to get session status: ${error.message}`);
      throw new InternalServerErrorException('Failed to get session status. Check logs.');
    }
  }

  async endVoiceSession(sessionId: string) {
    // Find VoiceSession by sessionId in database
    const voiceSession = await this.prisma.voiceSession.findUnique({
      where: { id: sessionId },
      include: { booking: true },
    });

    if (!voiceSession) {
      throw new NotFoundException('Voice session not found');
    }

    try {
      // Call Python service POST /sessions/{session_id}/end
      const response = await fetch(
        `${this.pythonServiceUrl}/sessions/${voiceSession.sessionId}/end`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Python voice agent service unavailable. Please try again.',
        );
      }

      const data: VoiceSessionEnd = await response.json();

      // Update VoiceSession in database
      await this.prisma.voiceSession.update({
        where: { id: sessionId },
        data: {
          endedAt: new Date(),
          transcript: data.transcript,
          durationSeconds: data.duration,
          status: 'completed',
        },
      });

      // Update related Booking status to COMPLETED
      await this.prisma.booking.update({
        where: { id: voiceSession.bookingId },
        data: { status: 'COMPLETED' },
      });

      this.logger.log(
        `Voice session ended: session=${sessionId}, duration=${data.duration}s, transcript_length=${data.transcript?.length || 0}`,
      );

      // Return final transcript
      return {
        success: data.success,
        transcript: data.transcript,
        duration: data.duration,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Failed to end voice session: ${error.message}`);
      throw new InternalServerErrorException('Failed to end voice session. Check logs.');
    }
  }

  async checkPythonHealth(): Promise<boolean> {
    // Call Python service GET /health
    try {
      const response = await fetch(`${this.pythonServiceUrl}/health`);
      if (!response.ok) {
        return false;
      }
      const data: PythonHealthResponse = await response.json();
      return data.status === 'ok';
    } catch (error) {
      this.logger.error(`Python health check failed: ${error.message}`);
      return false;
    }
  }
}
