// Expired meeting card shown when meeting link has expired
'use client';

import { ClockAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface ExpiredMeetingCardProps {
  agentName?: string;
  scheduledAt?: string | Date;
}

export function ExpiredMeetingCard({
  agentName = 'AI Agent',
  scheduledAt,
}: ExpiredMeetingCardProps) {
  const router = useRouter();

  const formattedDate = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'an earlier time';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ClockAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">This meeting link has expired</CardTitle>
          <CardDescription className="text-base">
            Meeting with <span className="font-medium">{agentName}</span> was
            scheduled for {formattedDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please contact support or request a new meeting link to schedule
            another conversation.
          </p>
          <Button
            className="w-full"
            onClick={() => router.push('/')}
          >
            Go to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
