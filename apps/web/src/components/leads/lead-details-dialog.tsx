'use client';

import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  LinkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Booking {
  id: string;
  scheduledAt: string;
  expiresAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  meetingToken?: string;
}

interface Agent {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  booking?: Booking;
  agent: Agent;
}

interface LeadDetailsDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function LeadDetailsDialog({
  lead,
  open,
  onOpenChange,
}: LeadDetailsDialogProps) {
  if (!lead) return null;

  const meetingLink = lead.booking?.meetingToken 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/meet/${lead.booking.meetingToken}`
    : null;
  const isExpired = lead.booking ? new Date(lead.booking.expiresAt) < new Date() : false;

  const handleCopyLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      toast.success('Meeting link copied to clipboard!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-gray-500" />
            Lead Details
          </DialogTitle>
          <DialogDescription>
            View complete information for this lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lead Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {lead.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{lead.name}</h3>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                  <EnvelopeIcon className="h-4 w-4" />
                  {lead.email}
                </p>
              </div>
            </div>
          </div>

          <hr />

          {/* Meeting Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
              Meeting Details
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Agent</p>
                <p className="font-medium">{lead.agent.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                {lead.booking ? (
                  <Badge className={statusColors[lead.booking.status]}>
                    {lead.booking.status}
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600">No Booking</Badge>
                )}
              </div>
            </div>

            {lead.booking && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Scheduled
                  </p>
                  <p className="font-medium">
                    {format(new Date(lead.booking.scheduledAt), 'PPp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    Expires
                  </p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                    {isExpired ? 'Expired' : format(new Date(lead.booking.expiresAt), 'PPp')}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">
                {format(new Date(lead.createdAt), 'PPp')}
              </p>
            </div>
          </div>

          <hr />

          {/* Meeting Link */}
          {meetingLink && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                Meeting Link
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 rounded-lg p-3 text-sm font-mono text-gray-600 truncate">
                  {meetingLink}
                </div>
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
