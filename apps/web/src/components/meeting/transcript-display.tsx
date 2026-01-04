// Scrollable transcript display showing conversation history
'use client';

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface TranscriptEntry {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface TranscriptDisplayProps {
  transcript: TranscriptEntry[];
  agentName?: string;
}

export function TranscriptDisplay({
  transcript,
  agentName = 'AI Agent',
}: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="h-40 sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
        Conversation transcript will appear here...
      </div>
    );
  }

  return (
    <ScrollArea className="h-40 sm:h-[300px] rounded-lg border bg-muted/30 p-4">
      <div ref={scrollRef} className="space-y-3">
        {transcript.map((entry, index) => (
          <div
            key={index}
            className={cn(
              'flex flex-col max-w-[85%]',
              entry.speaker === 'user' ? 'ml-auto items-end' : 'items-start'
            )}
          >
            <span className="text-xs text-muted-foreground mb-1">
              {entry.speaker === 'user' ? 'You' : agentName}
            </span>
            <div
              className={cn(
                'rounded-2xl px-4 py-2 text-sm',
                entry.speaker === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              {entry.text}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">
              {formatTime(entry.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Format timestamp as HH:MM
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
