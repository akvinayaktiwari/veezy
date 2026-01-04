// Canvas-based audio waveform visualization for voice activity
'use client';

import { useRef, useEffect, useCallback } from 'react';

interface AudioVisualizerProps {
  audioLevel: number; // 0-1 normalized audio level
  isActive: boolean;
  isSpeaking?: boolean;
}

export function AudioVisualizer({
  audioLevel,
  isActive,
  isSpeaking = false,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const barsRef = useRef<number[]>(Array(24).fill(0));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get actual dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const barCount = 24;
    const barWidth = width / barCount - 4;
    const maxBarHeight = height * 0.8;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Update bar heights with smoothing
    barsRef.current = barsRef.current.map((currentHeight, i) => {
      if (!isActive) {
        // Fade to static when inactive
        return currentHeight * 0.9;
      }

      // Generate target height based on audio level and position
      const centerDistance = Math.abs(i - barCount / 2) / (barCount / 2);
      const baseHeight = 0.1;
      const targetHeight = isActive
        ? baseHeight + audioLevel * (1 - centerDistance * 0.5) * (0.5 + Math.random() * 0.5)
        : baseHeight;

      // Smooth transition
      return currentHeight + (targetHeight - currentHeight) * 0.2;
    });

    // Draw bars
    barsRef.current.forEach((normalizedHeight, i) => {
      const barHeight = Math.max(4, normalizedHeight * maxBarHeight);
      const x = i * (barWidth + 4) + 2;
      const y = (height - barHeight) / 2;

      // Gradient based on activity - use actual colors since Canvas doesn't support CSS variables
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      if (isSpeaking) {
        gradient.addColorStop(0, '#3b82f6'); // blue-500
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.6)'); // blue-500/60
      } else {
        gradient.addColorStop(0, 'rgba(148, 163, 184, 0.6)'); // slate-400/60
        gradient.addColorStop(1, 'rgba(148, 163, 184, 0.3)'); // slate-400/30
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    });

    animationRef.current = requestAnimationFrame(draw);
  }, [audioLevel, isActive, isSpeaking]);

  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16 sm:h-20"
      aria-hidden="true"
    />
  );
}

// Simple pulsing circle fallback for minimal visualization
export function PulsingCircle({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center h-16">
      <div
        className={`
          w-4 h-4 rounded-full bg-primary
          ${isActive ? 'animate-pulse' : 'opacity-50'}
        `}
      />
    </div>
  );
}
