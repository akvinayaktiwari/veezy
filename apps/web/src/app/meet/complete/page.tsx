'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2, X } from 'lucide-react';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function CompletionContent() {
  const searchParams = useSearchParams();
  const agentName = searchParams.get('agent') || 'AI Agent';

  const handleClose = () => {
    // Try to close the window (only works if opened by script)
    if (window.opener) {
      window.close();
    } else {
      // Fallback - navigate to home
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-slate-800 border-slate-700">
        <CardContent className="pt-10 pb-10 text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <CheckCircle2 className="h-14 w-14 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">
            Call Completed
          </h1>

          {/* Description */}
          <p className="text-slate-300 mb-2">
            Thank you for speaking with {agentName}!
          </p>
          <p className="text-slate-400 text-sm mb-8">
            You may receive a follow-up email with additional information.
          </p>

          {/* Divider */}
          <div className="border-t border-slate-700 mb-8" />

          {/* Tips Section */}
          <div className="bg-slate-700/50 rounded-lg p-4 mb-8 text-left">
            <h3 className="text-sm font-medium text-slate-300 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                Our team will review the conversation and follow up if needed
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                You may receive relevant information via email
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                Feel free to book another call if you have more questions
              </li>
            </ul>
          </div>

          {/* Close Button */}
          <Button 
            onClick={handleClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white"
            size="lg"
          >
            <X className="h-4 w-4 mr-2" />
            Close Window
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MeetingCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CompletionContent />
    </Suspense>
  );
}
