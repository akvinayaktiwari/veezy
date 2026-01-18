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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, User, Phone, Mic, ChevronDown } from 'lucide-react';

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
  const [userStartedCall, setUserStartedCall] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

  const handleConnected = useCallback(() => {
    setConnectionState(ConnectionState.Connected);
  }, []);

  const handleDisconnected = useCallback(() => {
    setConnectionState(ConnectionState.Disconnected);
  }, []);

  // Request microphone permission explicitly
  const handleStartCall = useCallback(async () => {
    console.log('Start call clicked - requesting microphone permission...');
    try {
      // Request microphone access - this triggers browser permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted!', stream);
      // Stop the stream immediately - LiveKit will request it again
      stream.getTracks().forEach(track => track.stop());
      // Permission granted, start the call
      setUserStartedCall(true);
      setPermissionError(null);
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissionError('Microphone access is required for voice calls. Please allow microphone access and try again.');
    }
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

  // Show start button until user clicks (required for AudioContext)
  if (!userStartedCall) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Ready to talk with {agentName}?</h2>
            <p className="text-muted-foreground">
              Click the button below to start your voice call
            </p>
            {permissionError && (
              <p className="text-red-500 text-sm mt-2 max-w-md">{permissionError}</p>
            )}
          </div>
          <Button
            size="lg"
            onClick={handleStartCall}
            className="gap-2"
          >
            <Phone className="h-5 w-5" />
            Start Call
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={livekitToken}
      connect={true}
      audio={{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }}
      video={false}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      options={{ 
        disconnectOnPageLeave: true,
        publishDefaults: {
          audioPreset: {
            maxBitrate: 64000,
          }
        }
      }}
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
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

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

  // Enumerate audio devices
  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputs);
        
        // Set default device
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error('Failed to enumerate devices:', error);
      }
    };

    getAudioDevices();

    // Listen for device changes (plug/unplug)
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, [selectedDeviceId]);

  // Handle microphone device change
  const handleDeviceChange = useCallback(async (deviceId: string) => {
    if (!room || !localParticipant) return;
    
    try {
      // Switch to the new device using LiveKit's switchActiveDevice
      await room.switchActiveDevice('audioinput', deviceId);
      setSelectedDeviceId(deviceId);
      console.log('Switched to microphone:', deviceId);
    } catch (error) {
      console.error('Failed to switch microphone:', error);
    }
  }, [room, localParticipant]);

  // Subscribe to ALL audio tracks (including AI agent voice)
  const audioTracks = useTracks([
    Track.Source.Microphone,
    Track.Source.Unknown,  // Agent audio comes as Unknown source
  ]);

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
        
        <div className="flex items-center gap-2">
          {/* Microphone Selector */}
          {audioDevices.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mic className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Select Microphone</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {audioDevices.map((device) => (
                  <DropdownMenuItem
                    key={device.deviceId}
                    onClick={() => handleDeviceChange(device.deviceId)}
                    className={selectedDeviceId === device.deviceId ? 'bg-accent' : ''}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    {selectedDeviceId === device.deviceId && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Connection Status */}
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
        </div>
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
        {audioTracks
          .filter((trackRef) => trackRef.participant.sid !== localParticipant?.sid)
          .map((trackRef) => (
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
