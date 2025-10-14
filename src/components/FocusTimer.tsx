'use client';

import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Timer {
  id: string;
  startTime: string;
  isActive: boolean;
  project?: {
    id: string;
    title: string;
  };
}

interface FocusTimerProps {
  onTimerUpdate?: () => void;
  projects?: Array<{ id: string; title: string }>;
}

export function FocusTimer({ onTimerUpdate, projects = [] }: FocusTimerProps) {
  const [activeTimer, setActiveTimer] = useState<Timer | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Fetch active timer on mount
  useEffect(() => {
    fetchActiveTimer();
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    if (activeTimer?.isActive) {
      const interval = setInterval(() => {
        const start = new Date(activeTimer.startTime).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeTimer]);

  const fetchActiveTimer = async () => {
    try {
      const response = await fetch('/api/timer/active');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setActiveTimer(data);
          const start = new Date(data.startTime).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - start) / 1000);
          setElapsedSeconds(elapsed);
        }
      }
    } catch (error) {
      console.error('Error fetching active timer:', error);
    }
  };

  const startTimer = async () => {
    if (!selectedProjectId) {
      setIsProjectModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/timer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveTimer(data);
        setElapsedSeconds(0);
        onTimerUpdate?.();
        setIsProjectModalOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start timer');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Failed to start timer');
    } finally {
      setIsLoading(false);
    }
  };

  const stopTimer = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/timer/stop', {
        method: 'POST',
      });

      if (response.ok) {
        setActiveTimer(null);
        setElapsedSeconds(0);
        onTimerUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to stop timer');
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      alert('Failed to stop timer');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isTimerActive = activeTimer?.isActive;

  return (
    <div className="relative">
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-500',
          isTimerActive
            ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-red-600'
            : 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800'
        )}
      >
        {/* Animated background */}
        {isTimerActive && (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
          </div>
        )}

        <div className="relative p-8">
          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Clock
                className={cn(
                  'w-8 h-8 text-white',
                  isTimerActive && 'animate-pulse'
                )}
              />
            </div>
            <div className="text-6xl font-bold text-white tracking-wider mb-2 font-mono">
              {formatTime(elapsedSeconds)}
            </div>
            {activeTimer?.project && (
              <div className="text-white/80 text-sm font-medium">
                Working on: {activeTimer.project.title}
              </div>
            )}
            {isTimerActive && (
              <div className="text-white/60 text-xs mt-1 animate-pulse">
                Timer is running...
              </div>
            )}
          </div>

          {/* Project Selection */}
          {!isTimerActive && projects.length > 0 && (
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-2">
                Select Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id} className="bg-slate-800">
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-4">
            {!isTimerActive ? (
              <button
                onClick={startTimer}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-white/90 text-slate-900 font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              >
                <Play className="w-5 h-5" />
                Start Timer
              </button>
            ) : (
              <button
                onClick={stopTimer}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-white/90 text-slate-900 font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              >
                <Square className="w-5 h-5" />
                Stop Timer
              </button>
            )}
          </div>

          {/* Stats */}
          {isTimerActive && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {(elapsedSeconds / 3600).toFixed(2)}
                </div>
                <div className="text-white/60 text-xs">Hours</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {Math.floor(elapsedSeconds / 60)}
                </div>
                <div className="text-white/60 text-xs">Minutes</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Glow effect */}
      {isTimerActive && (
        <div className="absolute inset-0 -z-10 blur-3xl opacity-50 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 animate-pulse" />
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>

      {isProjectModalOpen && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Please select a project
            </h3>
            <div className="mb-6">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id} className="bg-slate-800">
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={startTimer}
                disabled={isLoading || !selectedProjectId}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-slate-900 font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
