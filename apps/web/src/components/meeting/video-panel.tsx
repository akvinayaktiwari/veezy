'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  VideoCameraIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import {
  VideoCameraSlashIcon,
  MicrophoneIcon as MicrophoneSolidIcon,
} from '@heroicons/react/24/solid';

interface VideoPanelProps {
  meetingToken: string;
  agentId: string;
  agentName: string;
  leadName: string;
  isActive: boolean;
}

/**
 * VideoPanel Component
 * 
 * MVP: Static placeholder for video interface
 * Future: Will integrate with Tavus API for real AI video calls
 * 
 * Structure is designed for easy swap to:
 * <TavusVideo meetingToken={meetingToken} agentId={agentId} />
 */
export function VideoPanel({
  meetingToken,
  agentId,
  agentName,
  leadName,
  isActive,
}: VideoPanelProps) {
  return (
    <Card className="h-full min-h-[400px] lg:min-h-[500px] bg-gray-900 border-gray-800">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Video Area */}
        <div className="flex-1 relative flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-lg">
          {/* Agent Avatar/Placeholder */}
          <div className="text-center">
            {/* Circular avatar placeholder */}
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {agentName.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-1">{agentName}</h3>
            <p className="text-gray-400 text-sm">AI Sales Agent</p>
            
            {/* MVP Notice */}
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg max-w-xs mx-auto">
              <VideoCameraIcon className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Video Call Interface</p>
              <p className="text-gray-500 text-xs mt-1">
                AI video agent will appear here
              </p>
              <p className="text-blue-400 text-xs mt-2">
                Tavus integration coming soon
              </p>
            </div>
          </div>

          {/* Connection Status */}
          {isActive && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Connected</span>
            </div>
          )}

          {/* Lead PiP (Picture in Picture) placeholder */}
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-400">
                  {leadName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">You</p>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-gray-800 rounded-b-lg">
          <div className="flex items-center justify-center gap-4">
            {/* Microphone (disabled for MVP) */}
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full bg-gray-700 border-gray-600 hover:bg-gray-600 cursor-not-allowed opacity-50"
              disabled
              title="Microphone controls coming soon"
            >
              <MicrophoneIcon className="h-5 w-5 text-gray-300" />
            </Button>

            {/* Camera (disabled for MVP) */}
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full bg-gray-700 border-gray-600 hover:bg-gray-600 cursor-not-allowed opacity-50"
              disabled
              title="Camera controls coming soon"
            >
              <VideoCameraIcon className="h-5 w-5 text-gray-300" />
            </Button>

            {/* Volume (disabled for MVP) */}
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full bg-gray-700 border-gray-600 hover:bg-gray-600 cursor-not-allowed opacity-50"
              disabled
              title="Volume controls coming soon"
            >
              <SpeakerWaveIcon className="h-5 w-5 text-gray-300" />
            </Button>
          </div>
          <p className="text-center text-gray-500 text-xs mt-2">
            Media controls will be enabled with Tavus integration
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
