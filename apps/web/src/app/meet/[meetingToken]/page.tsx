'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mic, MicOff, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Meeting Components
import { VoiceOnlyMode } from './voice-only-mode';
import { ExpiredMeetingCard } from '@/components/meeting/expired-meeting-card';

// Types
interface Lead {
  id: string;
  name: string;
  email: string;
}

interface Agent {
  id: string;
  name: string;
  knowledge: string;
}

interface Booking {
  id: string;
  scheduledAt: string;
  expiresAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  meetingToken: string;
  lead: Lead;
  agent: Agent;
  isExpired: boolean;
}

interface VoiceSession {
  sessionId: string;
  livekitToken: string;
  livekitUrl: string;
  status: string;
}

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const meetingToken = params.meetingToken as string;

  // State
  const [booking, setBooking] = useState<Booking | null>(null);
  const [voiceSession, setVoiceSession] = useState<VoiceSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  
  // Ref to prevent multiple session start attempts
  const sessionStartAttempted = useRef(false);

  // Fetch booking data
  const fetchBooking = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/meeting/${meetingToken}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Meeting not found');
        } else {
          throw new Error('Failed to load meeting');
        }
        return;
      }

      const data = await response.json();
      setBooking(data);
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Unable to load meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [meetingToken]);

  // Request microphone permission
  const requestMicPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      setHasMicPermission(true);
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setHasMicPermission(false);
      return false;
    }
  }, []);

  // Start voice session
  const startVoiceSession = useCallback(async () => {
    if (!booking) return;

    setIsStartingSession(true);
    setError(null);

    try {
      // First ensure we have mic permission
      const hasPermission = await requestMicPermission();
      if (!hasPermission) {
        setError('Microphone access is required for voice calls');
        setIsStartingSession(false);
        return;
      }

      // Start the voice session
      const response = await fetch('/api/voice-sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      // Handle 409 Conflict - session already exists, try to get existing session
      if (response.status === 409) {
        console.log('Session already exists, fetching existing session...');
        const existingSessionResponse = await fetch(`/api/voice-sessions/booking/${booking.id}/active`);
        if (existingSessionResponse.ok) {
          const existingSession = await existingSessionResponse.json();
          
          // If session needs restart (no valid token), end it and create new one
          if (existingSession.needsRestart) {
            console.log('Existing session needs restart, ending and creating new...');
            await fetch(`/api/voice-sessions/${existingSession.sessionId}/end`, { method: 'POST' });
            sessionStartAttempted.current = false; // Allow retry
            // Small delay then retry
            setTimeout(() => startVoiceSession(), 500);
            return;
          }
          
          setVoiceSession(existingSession);
          return;
        }
        // If we can't get the existing session, the error will be handled below
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to start voice session');
      }

      const sessionData = await response.json();
      setVoiceSession(sessionData);
    } catch (err) {
      console.error('Error starting voice session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start voice session');
    } finally {
      setIsStartingSession(false);
    }
  }, [booking, requestMicPermission]);

  // End voice session
  const endVoiceSession = useCallback(async () => {
    if (!voiceSession) return;

    try {
      await fetch(`/api/voice-sessions/${voiceSession.sessionId}/end`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error ending voice session:', err);
    }

    // Navigate to completion page
    router.push(`/meet/complete?agent=${encodeURIComponent(booking?.agent.name || 'AI Agent')}`);
  }, [voiceSession, booking, router]);

  // Cleanup session on tab close/navigate away
  useEffect(() => {
    if (!voiceSession) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Send beacon to end session (works even when tab is closing)
      navigator.sendBeacon(
        `/api/voice-sessions/${voiceSession.sessionId}/end`,
        JSON.stringify({ reason: 'tab_closed' })
      );
      
      // Show confirmation dialog (optional - remove if you want silent close)
      e.preventDefault();
      e.returnValue = 'You have an active call. Are you sure you want to leave?';
      return e.returnValue;
    };

    const handleVisibilityChange = () => {
      // Optional: End call when tab becomes hidden for extended period
      // Uncomment if you want this behavior:
      // if (document.visibilityState === 'hidden') {
      //   endVoiceSession();
      // }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [voiceSession, endVoiceSession]);

  // Initial fetch
  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Auto-start session when booking loads and is valid (only once)
  useEffect(() => {
    if (
      booking && 
      !booking.isExpired && 
      booking.status !== 'COMPLETED' && 
      booking.status !== 'CANCELLED' && 
      !voiceSession && 
      !isStartingSession &&
      !sessionStartAttempted.current
    ) {
      sessionStartAttempted.current = true;
      startVoiceSession();
    }
  }, [booking, voiceSession, isStartingSession, startVoiceSession]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Skeleton className="h-48 w-48 rounded-full mx-auto bg-slate-700" />
          <Skeleton className="h-8 w-48 mx-auto bg-slate-700" />
          <Skeleton className="h-4 w-64 mx-auto bg-slate-700" />
          <div className="flex justify-center gap-4 mt-8">
            <Skeleton className="h-14 w-14 rounded-full bg-slate-700" />
            <Skeleton className="h-14 w-14 rounded-full bg-slate-700" />
            <Skeleton className="h-14 w-14 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800 border-slate-700">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              {error === 'Meeting not found' ? 'Meeting Not Found' : 'Error Loading Meeting'}
            </h1>
            <p className="text-slate-400 mb-6">
              {error === 'Meeting not found'
                ? 'This meeting link is invalid or has been removed.'
                : error}
            </p>
            <Button 
              variant="outline" 
              onClick={fetchBooking}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) return null;

  // Expired state
  if (booking.isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <ExpiredMeetingCard
          agentName={booking.agent.name}
          scheduledAt={booking.scheduledAt}
        />
      </div>
    );
  }

  // Completed or cancelled state
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800 border-slate-700">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-600 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              Meeting {booking.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
            </h1>
            <p className="text-slate-400">
              This meeting has already {booking.status === 'COMPLETED' ? 'been completed' : 'been cancelled'}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Microphone permission denied
  if (hasMicPermission === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800 border-slate-700">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <MicOff className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Microphone Access Required</h1>
            <p className="text-slate-400 mb-6">
              Please allow microphone access to join this voice call. You can enable it in your browser settings.
            </p>
            <Button 
              onClick={requestMicPermission}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Mic className="h-4 w-4 mr-2" />
              Grant Microphone Access
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Starting session state
  if (isStartingSession || !voiceSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connecting...</h2>
          <p className="text-slate-400">Setting up your voice call with {booking.agent.name}</p>
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={startVoiceSession}
                className="mt-2 border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active voice session
  return (
    <VoiceOnlyMode
      livekitUrl={voiceSession.livekitUrl}
      livekitToken={voiceSession.livekitToken}
      agentName={booking.agent.name}
      leadName={booking.lead.name}
      onEndCall={endVoiceSession}
    />
  );
}
