// Voice-only meeting interface with LiveKit WebRTC integration
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
  AudioTrack,
} from '@livekit/components-react';
import { Track, RoomEvent, ConnectionState, Room } from 'livekit-client';

import { AudioControls } from '@/components/meeting/audio-controls';
import { AudioVisualizer } from '@/components/meeting/audio-visualizer';
import { TranscriptDisplay, TranscriptEntry } from '@/components/meeting/transcript-display';
import { Badge } from '@/components/ui/badge';
import { Loader2, User } from 'lucide-react';

interface VoiceOnlyModeProps {
  livekitUrl: string;
  livekitToken: string;
  agentName: string;
  leadName?: string;
  onEndCall: () => void;
}

export function VoiceOnlyMode({
  livekitUrl,
  livekitToken,
  agentName,
  leadName,
  onEndCall,
}: VoiceOnlyModeProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Connecting
  );
  const roomRef = useRef<Room | null>(null);

  const handleConnected = useCallback(() => {
    setConnectionState(ConnectionState.Connected);
  }, []);

  const handleDisconnected = useCallback(() => {
    setConnectionState(ConnectionState.Disconnected);
  }, []);

  // Properly disconnect from room when component unmounts or call ends
  const handleEndCallWithDisconnect = useCallback(async () => {
    // Disconnect from LiveKit room first
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    // Then call the parent's onEndCall
    onEndCall();
  }, [onEndCall]);

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={livekitToken}
      connect={true}
      audio={true}
      video={false}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      options={{ disconnectOnPageLeave: true }}
      className="min-h-screen"
    >
      <VoiceRoomContent
        agentName={agentName}
        connectionState={connectionState}
        onCallEnd={handleEndCallWithDisconnect}
        roomRef={roomRef}
      />
    </LiveKitRoom>
  );
}

// Inner component that has access to LiveKit room context
interface VoiceRoomContentProps {
  agentName: string;
  connectionState: ConnectionState;
  onCallEnd: () => void;
  roomRef: React.MutableRefObject<Room | null>;
}

function VoiceRoomContent({
  agentName,
  connectionState,
  onCallEnd,
  roomRef,
}: VoiceRoomContentProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [agentStatus, setAgentStatus] = useState<'listening' | 'thinking' | 'speaking'>('listening');

  // Store room reference for cleanup
  useEffect(() => {
    if (room) {
      roomRef.current = room;
    }
    return () => {
      // Cleanup on unmount
      if (room && room.state !== 'disconnected') {
        room.disconnect();
      }
    };
  }, [room, roomRef]);

  // Subscribe to remote audio tracks (AI agent voice)
  const audioTracks = useTracks([Track.Source.Microphone]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [localParticipant, isMuted]);

  // Handle volume change (affects playback)
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    // Apply volume to remote audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach((audio) => {
      audio.volume = newVolume / 100;
    });
  }, []);

  // Track audio levels for visualization
  useEffect(() => {
    if (!room) return;

    const updateAudioLevel = () => {
      // Get local participant's audio level for visualization
      const level = localParticipant?.audioLevel ?? 0;
      setAudioLevel(level);
    };

    const interval = setInterval(updateAudioLevel, 50);
    return () => clearInterval(interval);
  }, [room, localParticipant]);

  // Listen for data messages (transcript updates from agent)
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload));
        
        if (message.type === 'transcript') {
          setTranscript((prev) => [
            ...prev,
            {
              speaker: message.speaker,
              text: message.text,
              timestamp: new Date(),
            },
          ]);
        }
        
        if (message.type === 'agent_status') {
          setAgentStatus(message.status);
        }
      } catch (e) {
        // Ignore malformed messages
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  // Determine connection quality
  const connectionQuality = connectionState === ConnectionState.Connected
    ? 'good'
    : connectionState === ConnectionState.Reconnecting
    ? 'poor'
    : 'disconnected';

  // Status text based on agent state
  const statusText = {
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Badge variant="outline" className="text-sm">
          {agentName}
        </Badge>
        {connectionState === ConnectionState.Connecting && (
          <Badge variant="secondary" className="animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Connecting...
          </Badge>
        )}
        {connectionState === ConnectionState.Connected && (
          <Badge variant="default" className="bg-green-500">
            Connected
          </Badge>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
        {/* Agent Avatar Circle */}
        <div
          className={`
            relative w-32 h-32 sm:w-40 sm:h-40 rounded-full 
            bg-primary/10 flex items-center justify-center mb-8
            ${agentStatus === 'speaking' ? 'animate-pulse' : ''}
          `}
        >
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
          </div>
          {/* Pulsing ring when speaking */}
          {agentStatus === 'speaking' && (
            <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20" />
          )}
        </div>

        {/* Audio Visualizer */}
        <div className="w-full max-w-md mb-6">
          <AudioVisualizer
            audioLevel={audioLevel}
            isActive={connectionState === ConnectionState.Connected && !isMuted}
            isSpeaking={agentStatus === 'speaking'}
          />
        </div>

        {/* Status Text */}
        <p className="text-lg font-medium text-muted-foreground mb-8">
          {connectionState === ConnectionState.Connected
            ? statusText[agentStatus]
            : 'Connecting to agent...'}
        </p>

        {/* Transcript */}
        <div className="w-full max-w-md">
          <TranscriptDisplay transcript={transcript} agentName={agentName} />
        </div>

        {/* Render remote audio tracks */}
        {audioTracks.map((trackRef) => (
          <AudioTrack
            key={trackRef.participant.sid + trackRef.source}
            trackRef={trackRef}
          />
        ))}
      </main>

      {/* Controls Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-8 flex justify-center">
        <AudioControls
          isMuted={isMuted}
          onMuteToggle={handleMuteToggle}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          onEndCall={onCallEnd}
          connectionQuality={connectionQuality}
        />
      </footer>
    </div>
  );
}
