'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Icons
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

// Components
import { VideoPanel } from '@/components/meeting/video-panel';

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

// Status badge colors
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

export default function MeetingRoomPage() {
  const params = useParams();
  const meetingToken = params.meetingToken as string;

  // State
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallCompleted, setIsCallCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEndingCall, setIsEndingCall] = useState(false);

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

      // Auto-start call if not expired and not already completed
      if (!data.isExpired && data.status !== 'COMPLETED' && data.status !== 'CANCELLED') {
        setIsCallActive(true);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Unable to load meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [meetingToken]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Timer effect for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isCallActive && !isCallCompleted) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive, isCallCompleted]);

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // End call handler
  const handleEndCall = async () => {
    if (!booking) return;

    setIsEndingCall(true);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!response.ok) {
        throw new Error('Failed to end call');
      }

      setIsCallActive(false);
      setIsCallCompleted(true);
    } catch (err) {
      console.error('Error ending call:', err);
      // Still show completed state even if API fails
      setIsCallActive(false);
      setIsCallCompleted(true);
    } finally {
      setIsEndingCall(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Video Panel Skeleton */}
            <div className="lg:col-span-3">
              <Skeleton className="h-[500px] w-full rounded-lg" />
            </div>
            {/* Info Panel Skeleton */}
            <div className="lg:col-span-2">
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error === 'Meeting not found' ? 'Meeting Not Found' : 'Error Loading Meeting'}
            </h1>
            <p className="text-gray-600 mb-6">
              {error === 'Meeting not found'
                ? 'This meeting link is invalid or has been removed.'
                : error}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={fetchBooking}>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) return null;

  // Completed state
  if (isCallCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircleSolidIcon className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Call Completed</h1>
            <p className="text-gray-600 mb-2">
              Thank you for meeting with {booking.agent.name}!
            </p>
            <p className="text-gray-500 text-sm mb-6">
              You'll receive a follow-up email with the call summary.
            </p>
            
            {/* Call Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Call Summary</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Duration: {formatElapsedTime(elapsedTime)}</p>
                <p>Agent: {booking.agent.name}</p>
                <p>Scheduled: {format(new Date(booking.scheduledAt), 'PPp')}</p>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link href="/">Close Window</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired state
  if (booking.isExpired) {
    const expiryTime = new Date(booking.expiresAt);
    const scheduledTime = new Date(booking.scheduledAt);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-6">
          {/* Alert */}
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <AlertTitle>Meeting Link Expired</AlertTitle>
            <AlertDescription>
              This meeting was scheduled for {format(scheduledTime, 'PPp')} and the link expired{' '}
              {formatDistanceToNow(expiryTime, { addSuffix: true })}.
            </AlertDescription>
          </Alert>

          {/* Booking Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
              <CardDescription>This meeting can no longer be joined</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Agent</p>
                  <p className="font-medium">{booking.agent.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lead</p>
                  <p className="font-medium">{booking.lead.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Scheduled Time</p>
                  <p className="font-medium">{format(scheduledTime, 'PPp')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expired</p>
                  <p className="font-medium">{format(expiryTime, 'PPp')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-blue-800 text-center">
                Please contact the company to reschedule your meeting.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Active meeting state
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Left Panel - Video (60%) */}
          <div className="lg:col-span-3 order-1">
            <VideoPanel
              meetingToken={meetingToken}
              agentId={booking.agent.id}
              agentName={booking.agent.name}
              leadName={booking.lead.name}
              isActive={isCallActive}
            />
          </div>

          {/* Right Panel - Info (40%) */}
          <div className="lg:col-span-2 order-2">
            <Tabs defaultValue="info" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <InformationCircleIcon className="h-4 w-4" />
                  Meeting Info
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    {/* Agent Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {booking.agent.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{booking.agent.name}</h3>
                        <p className="text-gray-500 text-sm">AI Sales Agent</p>
                      </div>
                    </div>

                    {/* Lead Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xl font-medium text-gray-600">
                          {booking.lead.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{booking.lead.name}</h3>
                        <p className="text-gray-500 text-sm">{booking.lead.email}</p>
                      </div>
                    </div>

                    <hr />

                    {/* Meeting Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Scheduled</span>
                        <span className="font-medium">
                          {format(new Date(booking.scheduledAt), 'PPp')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Status</span>
                        <Badge className={statusColors[booking.status]}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>

                    <hr />

                    {/* Knowledge Base Preview */}
                    <div>
                      <h4 className="font-medium mb-2">Agent Knowledge</h4>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                        {booking.agent.knowledge.length > 300 ? (
                          <>
                            {booking.agent.knowledge.slice(0, 300)}...
                            <Button variant="link" className="p-0 h-auto text-blue-600">
                              Read more
                            </Button>
                          </>
                        ) : (
                          booking.agent.knowledge || 'No knowledge base configured'
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="mt-4">
                <Card className="min-h-[400px]">
                  <CardContent className="pt-6 h-full flex flex-col items-center justify-center text-center">
                    <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Live Transcript</h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                      AI conversation transcript will appear here in real-time
                    </p>
                    <Badge variant="outline" className="mt-4">
                      Coming Soon
                    </Badge>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Sticky */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Time Elapsed */}
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <span className="font-mono text-lg font-medium">
                {formatElapsedTime(elapsedTime)}
              </span>
              {isCallActive && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>

            {/* End Call Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="lg"
                  disabled={isEndingCall}
                  className="min-w-[140px]"
                >
                  <PhoneXMarkIcon className="h-5 w-5 mr-2" />
                  {isEndingCall ? 'Ending...' : 'End Call'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Call?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to end this call? The meeting will be marked as completed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEndCall}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    End Call
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Spacer for fixed bottom bar */}
      <div className="h-20" />
    </div>
  );
}
