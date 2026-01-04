// Audio controls bar for voice calls with mute, volume, and end call buttons
'use client';

import { useCallback, useState } from 'react';
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AudioControlsProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onEndCall: () => void;
  connectionQuality: 'good' | 'poor' | 'disconnected';
}

export function AudioControls({
  isMuted,
  onMuteToggle,
  volume,
  onVolumeChange,
  onEndCall,
  connectionQuality,
}: AudioControlsProps) {
  const [showEndDialog, setShowEndDialog] = useState(false);

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      onVolumeChange(value[0]);
    },
    [onVolumeChange]
  );

  const handleEndCall = useCallback(() => {
    setShowEndDialog(false);
    onEndCall();
  }, [onEndCall]);

  // Connection quality indicator colors
  const qualityColors = {
    good: 'bg-green-500',
    poor: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  };

  const qualityLabels = {
    good: 'Connected',
    poor: 'Poor Connection',
    disconnected: 'Disconnected',
  };

  return (
    <>
      <div className="flex items-center justify-center gap-4 p-4 bg-background/80 backdrop-blur-sm rounded-2xl border shadow-lg">
        {/* Mute Button */}
        <Button
          variant={isMuted ? 'destructive' : 'secondary'}
          size="lg"
          className="h-14 w-14 rounded-full"
          onClick={onMuteToggle}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        {/* Volume Control */}
        <div className="hidden sm:flex items-center gap-2 px-4">
          <Volume2 className="h-5 w-5 text-muted-foreground" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-24"
            aria-label="Volume"
          />
        </div>

        {/* End Call Button */}
        <Button
          variant="destructive"
          size="lg"
          className="h-14 w-14 rounded-full"
          onClick={() => setShowEndDialog(true)}
          aria-label="End call"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>

        {/* Connection Quality Badge */}
        <Badge
          variant="outline"
          className="ml-2 hidden sm:flex items-center gap-1.5"
        >
          <span
            className={`h-2 w-2 rounded-full ${qualityColors[connectionQuality]}`}
          />
          {qualityLabels[connectionQuality]}
        </Badge>
      </div>

      {/* End Call Confirmation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Call?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this call? Your conversation will be
              saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEndCall}>
              End Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
