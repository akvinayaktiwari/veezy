'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAgent } from '@/contexts/agent-context';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Components
import { StatCard } from '@/components/dashboard/stat-card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { LeadDetailsDialog } from '@/components/leads/lead-details-dialog';

// Icons
import {
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  EllipsisVerticalIcon,
  LinkIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  UserPlusIcon,
  ClipboardDocumentIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

// Types
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
  publicLink?: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  booking?: Booking;  // Optional - lead may not have a booking yet
  agent: Agent;
}

interface LeadStats {
  total: number;
  upcoming: number;
  completed: number;
  conversionRate: number;
}

// Status badge colors
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Sort types
type SortField = 'name' | 'scheduledAt' | 'status';
type SortDirection = 'asc' | 'desc';

export default function LeadsDashboardPage() {
  const { selectedAgentId, selectedAgent, isLoading: agentLoading } = useAgent();

  // Data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Sort states
  const [sortField, setSortField] = useState<SortField>('scheduledAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Dialog states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    if (!selectedAgentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [leadsRes, statsRes] = await Promise.all([
        fetch(`/api/leads?agentId=${selectedAgentId}`),
        fetch(`/api/leads/stats?agentId=${selectedAgentId}`),
      ]);

      if (!leadsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch leads');
      }

      const [leadsData, statsData] = await Promise.all([
        leadsRes.json(),
        statsRes.json(),
      ]);

      // Transform backend response - convert bookings array to single booking
      const transformedLeads: Lead[] = leadsData.map((lead: any) => ({
        ...lead,
        booking: lead.bookings?.[0] || undefined,  // Get first booking if exists
      }));

      setLeads(transformedLeads);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to load leads. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'upcoming') {
        result = result.filter(
          (lead) =>
            lead.booking &&
            (lead.booking.status === 'PENDING' || lead.booking.status === 'CONFIRMED') &&
            !isPast(new Date(lead.booking.scheduledAt))
        );
      } else if (statusFilter === 'expired') {
        result = result.filter((lead) => lead.booking && isPast(new Date(lead.booking.expiresAt)));
      } else {
        result = result.filter((lead) => lead.booking?.status === statusFilter);
      }
    }

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(search) ||
          lead.email.toLowerCase().includes(search)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysAgo = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 0;
      if (daysAgo > 0) {
        const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        result = result.filter((lead) => new Date(lead.createdAt) >= cutoff);
      }
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'scheduledAt':
          // Handle leads without booking - push them to the end
          if (!a.booking && !b.booking) comparison = 0;
          else if (!a.booking) comparison = 1;
          else if (!b.booking) comparison = -1;
          else comparison = new Date(a.booking.scheduledAt).getTime() - new Date(b.booking.scheduledAt).getTime();
          break;
        case 'status':
          // Handle leads without booking - push them to the end
          if (!a.booking && !b.booking) comparison = 0;
          else if (!a.booking) comparison = 1;
          else if (!b.booking) comparison = -1;
          else comparison = a.booking.status.localeCompare(b.booking.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, statusFilter, debouncedSearch, dateFilter, sortField, sortDirection]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Copy meeting link
  const handleCopyLink = (lead: Lead) => {
    if (!lead.booking?.meetingToken) {
      toast.error('No meeting link available');
      return;
    }
    const link = `${window.location.origin}/meet/${lead.booking.meetingToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied!');
  };

  // Copy booking link
  const handleCopyBookingLink = () => {
    if (!selectedAgent) return;
    const link = `${window.location.origin}/book/${selectedAgent.publicLink}`;
    navigator.clipboard.writeText(link);
    toast.success('Booking link copied!');
  };

  // View lead details
  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailsDialogOpen(true);
  };

  // Delete lead
  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;

    try {
      // For MVP, just remove from local state
      // TODO: Add DELETE API endpoint
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      toast.success('Lead deleted successfully');
    } catch (err) {
      toast.error('Failed to delete lead');
    } finally {
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  // Mark as completed
  const handleMarkCompleted = async (lead: Lead) => {
    if (!lead.booking) {
      toast.error('No booking to update');
      return;
    }
    try {
      const response = await fetch(`/api/bookings/${lead.booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Update local state
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id && l.booking
            ? { ...l, booking: { ...l.booking, status: 'COMPLETED' as const } }
            : l
        )
      );
      toast.success('Lead marked as completed');
    } catch (err) {
      toast.error('Failed to update lead status');
    }
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="h-4 w-4 inline ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 inline ml-1" />
    );
  };

  // No agent selected state
  if (!selectedAgentId && !agentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Agent Selected</h2>
          <p className="text-gray-500">Please select an agent from the navbar to view leads</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || agentLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchLeads}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-500 mt-1">
              Manage leads for {selectedAgent?.name}
            </p>
          </div>
        </div>

        <EmptyState
          icon={<UserPlusIcon className="h-16 w-16" />}
          title="No leads yet"
          description="Share your booking link to start receiving leads"
          action={{
            label: 'Copy Booking Link',
            onClick: handleCopyBookingLink,
          }}
        />

        {selectedAgent && (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-2">Your booking link:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm truncate">
                  {window.location.origin}/book/{selectedAgent.publicLink}
                </code>
                <Button size="icon" variant="outline" onClick={handleCopyBookingLink}>
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">
            Manage leads for {selectedAgent?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLeads}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="ghost" disabled title="Export leads to CSV - Coming soon">
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats?.total ?? 0}
          icon={<UserGroupIcon className="h-6 w-6" />}
        />
        <StatCard
          title="Upcoming Meetings"
          value={stats?.upcoming ?? 0}
          icon={<CalendarIcon className="h-6 w-6" />}
        />
        <StatCard
          title="Completed Calls"
          value={stats?.completed ?? 0}
          icon={<CheckCircleIcon className="h-6 w-6" />}
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats?.conversionRate ?? 0}%`}
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No leads match your filters</p>
              <Button
                variant="link"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                  setDateFilter('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('name')}
                      >
                        Name {renderSortIcon('name')}
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('scheduledAt')}
                      >
                        Scheduled {renderSortIcon('scheduledAt')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('status')}
                      >
                        Status {renderSortIcon('status')}
                      </TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Meeting Link</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => {
                      const isExpired = lead.booking ? isPast(new Date(lead.booking.expiresAt)) : false;
                      return (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell className="text-gray-500 max-w-[200px] truncate">
                            {lead.email}
                          </TableCell>
                          <TableCell>
                            {lead.booking ? (
                              <>
                                {format(new Date(lead.booking.scheduledAt), 'MMM d, yyyy')}
                                <br />
                                <span className="text-gray-500 text-sm">
                                  {format(new Date(lead.booking.scheduledAt), 'h:mm a')}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400">No booking</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.booking ? (
                              <Badge className={statusColors[lead.booking.status]}>
                                {lead.booking.status}
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-600">No Booking</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!lead.booking ? (
                              <span className="text-gray-400">-</span>
                            ) : isExpired ? (
                              <span className="text-red-600 text-sm">Expired</span>
                            ) : (
                              <span className="text-gray-500 text-sm">
                                {formatDistanceToNow(new Date(lead.booking.expiresAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.booking?.meetingToken ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyLink(lead)}
                              >
                                <LinkIcon className="h-4 w-4 mr-1" />
                                Copy
                              </Button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <EllipsisVerticalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(lead)}>
                                  <EyeIcon className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {lead.booking?.meetingToken && (
                                  <DropdownMenuItem onClick={() => handleCopyLink(lead)}>
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    Copy Link
                                  </DropdownMenuItem>
                                )}
                                {lead.booking && (lead.booking.status === 'PENDING' ||
                                  lead.booking.status === 'CONFIRMED') && (
                                  <DropdownMenuItem onClick={() => handleMarkCompleted(lead)}>
                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                    Mark as Completed
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteClick(lead)}
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredLeads.map((lead) => {
                  const isExpired = lead.booking ? isPast(new Date(lead.booking.expiresAt)) : false;
                  return (
                    <Card key={lead.id} className="relative">
                      <CardContent className="pt-4">
                        <div className="absolute top-4 right-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <EllipsisVerticalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(lead)}>
                                <EyeIcon className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {lead.booking?.meetingToken && (
                                <DropdownMenuItem onClick={() => handleCopyLink(lead)}>
                                  <LinkIcon className="h-4 w-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                              )}
                              {lead.booking && (lead.booking.status === 'PENDING' ||
                                lead.booking.status === 'CONFIRMED') && (
                                <DropdownMenuItem onClick={() => handleMarkCompleted(lead)}>
                                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteClick(lead)}
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <h3 className="font-semibold text-lg pr-10">{lead.name}</h3>
                        <p className="text-gray-500 text-sm">{lead.email}</p>

                        <div className="mt-3 flex items-center gap-2">
                          {lead.booking ? (
                            <Badge className={statusColors[lead.booking.status]}>
                              {lead.booking.status}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600">No Booking</Badge>
                          )}
                          {isExpired && (
                            <span className="text-red-600 text-sm">Expired</span>
                          )}
                        </div>

                        {lead.booking && (
                          <p className="mt-2 text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4 inline mr-1" />
                            {format(new Date(lead.booking.scheduledAt), 'PPp')}
                          </p>
                        )}

                        {lead.booking?.meetingToken && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => handleCopyLink(lead)}
                          >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Copy Meeting Link
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lead Details Dialog */}
      <LeadDetailsDialog
        lead={selectedLead}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {leadToDelete?.name}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
