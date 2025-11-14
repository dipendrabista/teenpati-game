'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  Settings,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { VoiceChatParticipant } from '@/lib/voiceChat';

interface VoiceChatProps {
  gameId: string;
  currentPlayerId: string;
  currentPlayerName: string;
  signaling?: { on: (ev: string, cb: (...args: any[]) => void) => void; emit: (ev: string, payload: any) => void };
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export function VoiceChat({
  gameId,
  currentPlayerId,
  currentPlayerName,
  signaling,
  isVisible = true,
  onToggleVisibility
}: VoiceChatProps) {
  const {
    isSupported,
    isInitialized,
    isJoined,
    participants,
    error,
    initialize,
    join,
    leave,
    toggleMute,
    setParticipantVolume,
    getLocalStream,
  } = useVoiceChat(gameId, currentPlayerId, currentPlayerName, signaling);

  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [participantVolumes, setParticipantVolumes] = useState<Record<string, number>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [micTesting, setMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Handle mute toggle
  const handleToggleMute = () => {
    const newMutedState = toggleMute();
    setIsMuted(newMutedState);
  };

  // Handle participant volume change
  const handleVolumeChange = (playerId: string, volume: number[]) => {
    const newVolume = volume[0];
    setParticipantVolumes(prev => ({ ...prev, [playerId]: newVolume }));
    setParticipantVolume(playerId, newVolume / 100);
  };

  // Initialize audio elements for remote streams
  useEffect(() => {
    participants.forEach(participant => {
      if (participant.stream && participant.playerId !== currentPlayerId) {
        if (!audioRefs.current[participant.playerId]) {
          const audio = new Audio();
          audio.srcObject = participant.stream;
          (audio as any).playsInline = true;
          audio.autoplay = true;
          audio.muted = false;
          audio.volume = (participantVolumes[participant.playerId] || 100) / 100;
          try {
            // Route to default output device when supported
            if (typeof (audio as any).setSinkId === 'function') {
              (audio as any).setSinkId('default').catch(() => {});
            }
          } catch {}
          audioRefs.current[participant.playerId] = audio;
          // Try to play immediately; browsers may require a user gesture
          audio.play().catch(() => {
            // Will start once user interacts; no-op
          });
        } else {
          // Update volume if already created
          audioRefs.current[participant.playerId].volume = (participantVolumes[participant.playerId] || 100) / 100;
        }
      }
    });

    // Cleanup
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        try { audio.pause(); } catch {}
        try { (audio as any).srcObject = null; } catch {}
      });
      audioRefs.current = {};
    };
  }, [participants, participantVolumes, currentPlayerId]);

  // Mic test start/stop
  const startMicTest = async () => {
    try {
      const stream = getLocalStream();
      if (!stream) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        // Compute RMS for smoother, more representative level
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128; // [-1, 1]
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / data.length); // 0..~1
        // Scale aggressively so casual speech reaches ~60-80%
        const scaled = Math.min(1, rms * 2.0); // amplify
        setMicLevel(Math.min(100, Math.round(scaled * 100)));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
      setMicTesting(true);
    } catch {}
  };

  const stopMicTest = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setMicTesting(false);
    setMicLevel(0);
  };

  // Auto-start voice flow when panel is shown: request mic, then join
  useEffect(() => {
    if (!isVisible) return;
    if (!isSupported) return;
    (async () => {
      try {
        if (!isInitialized) {
          await initialize();
        }
        if (!isJoined) {
          await join();
        }
      } catch (e) {
        // errors are handled via `error` state already
      }
    })();
  }, [isVisible, isSupported, isInitialized, isJoined, initialize, join]);

  // If voice chat is not supported
  if (!isSupported) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Voice chat not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="space-y-4"
        >
              {/* Hidden audio mounts for remote streams (improves autoplay reliability) */}
              <div className="hidden" aria-hidden="true">
                {participants.filter(p => p.playerId !== currentPlayerId && p.stream).map(p => (
                  <audio
                    key={`aud-${p.playerId}`}
                    autoPlay
                    playsInline
                    data-player-id={p.playerId}
                    ref={el => {
                      if (el && p.stream) {
                        if ((el as any).srcObject !== p.stream) {
                          (el as any).srcObject = p.stream as any;
                        }
                        el.muted = false;
                        el.volume = (participantVolumes[p.playerId] || 100) / 100;
                        try {
                          if (typeof (el as any).setSinkId === 'function') {
                            (el as any).setSinkId('default').catch(() => {});
                          }
                        } catch {}
                        // attempt play
                        el.play().catch(() => {});
                      }
                    }}
                  />
                ))}
              </div>
          {/* Voice Chat Controls */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5" />
                  Voice Chat
                  {isJoined && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleVisibility}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status and Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {error ? (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  ) : !isInitialized ? (
                    <Badge variant="secondary" className="text-xs">
                      Not Started
                    </Badge>
                  ) : !isJoined ? (
                    <Badge variant="secondary" className="text-xs">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      <Users className="h-3 w-3 mr-1" />
                      {participants.length} connected
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>

                  {!isInitialized ? (
                    <Button onClick={initialize} size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Start Voice
                    </Button>
                  ) : !isJoined ? (
                    <Button onClick={join} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Phone className="h-4 w-4 mr-2" />
                      Join Chat
                    </Button>
                  ) : (
                    <Button onClick={leave} variant="destructive" size="sm">
                      <PhoneOff className="h-4 w-4 mr-2" />
                      Leave
                    </Button>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Voice Controls */}
              {isJoined && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Button
                    onClick={handleToggleMute}
                    variant={isMuted ? "destructive" : "default"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        Unmute
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Mute
                      </>
                    )}
                  </Button>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {isMuted ? 'You are muted' : 'You are speaking'}
                  </div>
                </div>
              )}

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <h4 className="font-medium">Voice Settings</h4>

                    {/* Mic test */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mic Test</span>
                        {micTesting ? (
                          <Button size="sm" variant="outline" onClick={stopMicTest}>
                            Stop
                          </Button>
                        ) : (
                          <Button size="sm" onClick={startMicTest} disabled={!isInitialized}>
                            Start
                          </Button>
                        )}
                      </div>
                      <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-[width] duration-75"
                          style={{ width: `${micLevel}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{micLevel}%</div>
                    </div>

                    {/* Participant Volume Controls */}
                    {participants
                      .filter(p => p.playerId !== currentPlayerId)
                      .map(participant => (
                        <div key={participant.playerId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {participant.playerName}
                            </span>
                            <div className="flex items-center gap-2">
                              {participant.isConnected ? (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                  Connected
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Connecting...
                                </Badge>
                              )}
                              {participant.isMuted && (
                                <MicOff className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <VolumeX className="h-4 w-4 text-gray-400" />
                            <Slider
                              value={[participantVolumes[participant.playerId] || 100]}
                              onValueChange={(value) => handleVolumeChange(participant.playerId, value)}
                              max={100}
                              step={5}
                              className="flex-1"
                            />
                            <Volume2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm w-12 text-right">
                              {(participantVolumes[participant.playerId] || 100)}%
                            </span>
                          </div>
                        </div>
                      ))}

                    {participants.filter(p => p.playerId !== currentPlayerId).length === 0 && (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        No other participants in voice chat
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact voice chat indicator for the game UI
export function VoiceChatIndicator({
  isMuted,
  participantCount,
  onToggle,
  isVisible
}: {
  isMuted: boolean;
  participantCount: number;
  onToggle: () => void;
  isVisible: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-4 right-4 z-40"
    >
      <Button
        onClick={onToggle}
        variant={isVisible ? "default" : "secondary"}
        size="sm"
        className={`rounded-full p-3 shadow-lg ${
          isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        <div className="flex items-center gap-2">
          {isMuted ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {participantCount > 1 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {participantCount}
            </Badge>
          )}
        </div>
      </Button>
    </motion.div>
  );
}

// Voice chat permission request modal
export function VoiceChatPermissionModal({
  isOpen,
  onGrant,
  onDeny
}: {
  isOpen: boolean;
  onGrant: () => void;
  onDeny: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
          >
            <div className="text-center mb-6">
              <Mic className="h-12 w-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Enable Voice Chat
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Voice chat allows you to communicate with other players during the game.
                Your microphone will be used for voice communication.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🎤 Your microphone access is required for voice chat to work.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={onDeny} variant="outline" className="flex-1">
                Not Now
              </Button>
              <Button onClick={onGrant} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Enable Voice
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
