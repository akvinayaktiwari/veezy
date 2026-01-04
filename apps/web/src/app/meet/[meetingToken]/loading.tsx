import { Skeleton } from '@/components/ui/skeleton';

export default function MeetingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Avatar Skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-48 w-48 rounded-full bg-slate-700" />
        </div>

        {/* Name Skeleton */}
        <Skeleton className="h-8 w-48 mx-auto bg-slate-700" />

        {/* Status Skeleton */}
        <Skeleton className="h-4 w-32 mx-auto bg-slate-700" />

        {/* Timer Skeleton */}
        <div className="pt-4">
          <Skeleton className="h-6 w-24 mx-auto bg-slate-700" />
        </div>

        {/* Transcript Area Skeleton */}
        <div className="pt-8 space-y-3">
          <Skeleton className="h-12 w-full bg-slate-700 rounded-lg" />
          <Skeleton className="h-12 w-3/4 bg-slate-700 rounded-lg" />
          <Skeleton className="h-12 w-5/6 ml-auto bg-slate-700 rounded-lg" />
        </div>

        {/* Controls Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 p-6">
          <div className="flex justify-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full bg-slate-700" />
            <Skeleton className="h-14 w-14 rounded-full bg-slate-700" />
            <Skeleton className="h-14 w-14 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
