'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CheckCircleIcon, ClipboardDocumentIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface Agent {
  id: string;
  name: string;
  knowledge: string;
  publicLink: string;
  linkExpiryHours: number;
}

interface BookingData {
  id: string;
  scheduledAt: string;
  expiresAt: string;
  meetingToken: string;
}

export default function BookingPage() {
  const params = useParams();
  const publicLink = params.publicLink as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullKnowledge, setShowFullKnowledge] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success state
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [meetingToken, setMeetingToken] = useState<string | null>(null);

  // Fetch agent data
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/agents/by-link/${publicLink}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Agent not found. Please check your link.');
          } else {
            setError('Failed to load agent information.');
          }
          return;
        }

        const data = await response.json();
        setAgent(data);
      } catch (err) {
        console.error('Error fetching agent:', err);
        setError('Failed to load agent information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (publicLink) {
      fetchAgent();
    }
  }, [publicLink]);

  // Set minimum datetime to now
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30); // Set to 30 minutes from now
      const minDateTime = now.toISOString().slice(0, 16);
      const dateInput = document.getElementById('scheduledAt') as HTMLInputElement;
      if (dateInput) {
        dateInput.min = minDateTime;
      }
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agent) return;

    // Validate fields
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!scheduledAt) {
      toast.error('Please select a date and time');
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/leads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          name: name.trim(),
          email: email.trim(),
          scheduledAt: scheduledDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to schedule meeting');
        return;
      }

      // Success - show confirmation
      setBooking(data.booking);
      setMeetingToken(data.meetingToken);
      toast.success('Meeting scheduled successfully!');
    } catch (err) {
      console.error('Error creating booking:', err);
      toast.error('Failed to schedule meeting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyMeetingLink = () => {
    if (!meetingToken) return;
    
    const meetingLink = `${window.location.origin}/meet/${meetingToken}`;
    navigator.clipboard.writeText(meetingLink);
    toast.success('Meeting link copied to clipboard!');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  };

  const getKnowledgePreview = () => {
    if (!agent?.knowledge) return '';
    if (showFullKnowledge) return agent.knowledge;
    return agent.knowledge.length > 200
      ? agent.knowledge.slice(0, 200) + '...'
      : agent.knowledge;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-32 mx-auto mb-2" />
            <Skeleton className="h-10 w-48 mx-auto" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-20 w-full mt-4" />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error || 'Agent not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Please check your link or contact support for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (booking && meetingToken) {
    const meetingLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/meet/${meetingToken}`;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Meeting Scheduled!
            </h1>
            <p className="text-lg text-gray-600">
              Your call with {agent.name} is confirmed
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Name</Label>
                <p className="text-base font-medium">{name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Email</Label>
                <p className="text-base font-medium">{email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Scheduled Time</Label>
                <p className="text-base font-medium">{formatDateTime(booking.scheduledAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">Your Meeting Link</CardTitle>
              <CardDescription>
                This link expires {agent.linkExpiryHours} hours after your scheduled time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 break-all font-mono text-sm">
                {meetingLink}
              </div>
              <Button
                onClick={copyMeetingLink}
                variant="outline"
                className="w-full"
              >
                <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                Copy Meeting Link
              </Button>
              <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-blue-900">
                  ✓ We've sent a confirmation email to <strong>{email}</strong>
                </p>
                <p className="text-sm text-blue-900">
                  ✓ Join the call at your scheduled time using the link above
                </p>
                <p className="text-sm text-blue-900">
                  ✓ Add this to your calendar so you don't forget
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Booking form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Veezy</h1>
          <h2 className="text-4xl font-bold text-gray-900">Book a Call</h2>
        </div>

        {/* Agent Info Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{agent.name}</CardTitle>
                <CardDescription className="text-base">
                  AI Assistant ready to help you
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                About this assistant
              </Label>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {getKnowledgePreview()}
              </p>
              {agent.knowledge.length > 200 && (
                <button
                  onClick={() => setShowFullKnowledge(!showFullKnowledge)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 flex items-center gap-1"
                >
                  {showFullKnowledge ? (
                    <>
                      Show less <ChevronUpIcon className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDownIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Form Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Schedule Your Meeting</CardTitle>
            <CardDescription>
              Fill in your details below to book a call with {agent.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={submitting}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt">When would you like to meet? *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  disabled={submitting}
                  className="text-base"
                />
                <p className="text-xs text-gray-500">
                  Select a date and time in your local timezone
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 text-base font-semibold"
              >
                {submitting ? 'Scheduling...' : 'Schedule Meeting'}
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By scheduling, you agree to receive meeting reminders via email
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Trust indicators */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>🔒 Your information is secure and will not be shared</p>
        </div>
      </div>
    </div>
  );
}
