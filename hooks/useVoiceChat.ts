import { useState, useEffect } from 'react';
import { VoiceChatManager, VoiceChatParticipant } from '@/lib/voiceChat';

// React hook for voice chat
// signaling must implement: on(event, handler) and emit(event, payload)
export function useVoiceChat(
  gameId: string,
  currentPlayerId: string,
  currentPlayerName: string,
  signaling?: { on: (ev: string, cb: (...args: any[]) => void) => void; emit: (ev: string, payload: any) => void }
) {
  const [voiceChat] = useState(() => new VoiceChatManager());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<VoiceChatParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fallbackEnabled, setFallbackEnabled] = useState(false);
  const mediaRecorderRef = (typeof window !== 'undefined') ? (window as any).___vcMediaRecRef || { current: null } : { current: null };
  if (typeof window !== 'undefined' && !(window as any).___vcMediaRecRef) { (window as any).___vcMediaRecRef = mediaRecorderRef; }

  const arrayBufferToBase64 = (buf: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  };
  const base64ToBlobUrl = (b64: string, mime = 'audio/webm;codecs=opus'): string => {
    const binary = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  };

  // Initialize voice chat
  const initialize = async () => {
    try {
      setError(null);
      await voiceChat.initialize();
      setIsInitialized(true);
      setFallbackEnabled(!VoiceChatManager.isSupported());
      console.log('🎤 Voice chat initialized');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize voice chat';
      setError(errorMessage);
      // If WebRTC not available, enable fallback recorder mode
      setFallbackEnabled(true);
      console.error('Failed to initialize voice chat:', err);
    }
  };

  // Join voice chat
  const join = async () => {
    if (!isInitialized) return;

    try {
      setError(null);
      await voiceChat.joinRoom(currentPlayerId, currentPlayerName);
      setIsJoined(true);
      setParticipants(voiceChat.getAllParticipants());
      console.log('🎤 Joined voice chat room');

      // Announce join to others for signaling
      signaling?.emit('voice_join', { gameId, playerId: currentPlayerId, playerName: currentPlayerName });

      // Start fallback streaming if enabled
      if (fallbackEnabled) {
        const stream = (voiceChat as any).getLocalStream?.();
        if (stream && typeof MediaRecorder !== 'undefined') {
          try {
            const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
              ? 'audio/webm;codecs=opus'
              : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
            const mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
            mediaRecorderRef.current = mr;
            mr.ondataavailable = async (e: BlobEvent) => {
              if (!e.data || e.data.size === 0) return;
              try {
                const buf = await e.data.arrayBuffer();
                const b64 = arrayBufferToBase64(buf);
                signaling?.emit('voice_chunk', { gameId, from: currentPlayerId, data: b64, ts: Date.now() });
              } catch {}
            };
            mr.start(200); // 200ms chunks
          } catch (e) {
            console.warn('Fallback MediaRecorder failed:', e);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join voice chat';
      setError(errorMessage);
      console.error('Failed to join voice chat:', err);
    }
  };

  // Leave voice chat
  const leave = async () => {
    try {
      signaling?.emit('voice_leave', { gameId, playerId: currentPlayerId });
      // Stop fallback recorder
      try {
        mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop();
      } catch {}
      await voiceChat.leaveRoom();
      setIsJoined(false);
      setParticipants([]);
      setIsInitialized(false);
      setFallbackEnabled(false);
      console.log('🎤 Left voice chat room');
    } catch (err) {
      console.error('Failed to leave voice chat:', err);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    return voiceChat.toggleMute();
  };

  // Set participant volume
  const setParticipantVolume = (playerId: string, volume: number) => {
    voiceChat.setParticipantVolume(playerId, volume);
  };

  // Handle remote stream
  useEffect(() => {
    voiceChat.onRemoteStream = (playerId, stream) => {
      setParticipants(prev => prev.map(p =>
        p.playerId === playerId ? { ...p, stream } : p
      ));
    };

    voiceChat.onConnectionStateChange = (playerId, state) => {
      setParticipants(prev => prev.map(p =>
        p.playerId === playerId ? { ...p, isConnected: state === 'connected' } : p
      ));
    };

    voiceChat.onParticipantJoined = (participant) => {
      setParticipants(prev => {
        const exists = prev.some(p => p.playerId === participant.playerId);
        return exists ? prev : [...prev, participant];
      });
    };

    voiceChat.onParticipantLeft = (playerId) => {
      setParticipants(prev => prev.filter(p => p.playerId !== playerId));
    };

    return () => {
      voiceChat.onRemoteStream = undefined;
      voiceChat.onConnectionStateChange = undefined;
      voiceChat.onParticipantJoined = undefined;
      voiceChat.onParticipantLeft = undefined;
    };
  }, [voiceChat]);

  // Hook up Socket.IO signaling
  useEffect(() => {
    if (!signaling) return;

    const onJoin = async ({ playerId, playerName }: { playerId: string; playerName: string }) => {
      if (!isJoined || playerId === currentPlayerId) return;
      try {
        // Ensure we have a participant entry with a friendly name before negotiation
        try {
          (voiceChat as any).participants?.set?.(playerId, {
            playerId,
            playerName,
            isMuted: false,
            isConnected: false,
            volume: 1.0,
          });
        } catch {}
        if (!fallbackEnabled) {
          const offer = await voiceChat.createOffer(playerId);
          signaling.emit('voice_offer', { gameId, from: currentPlayerId, to: playerId, sdp: offer });
        }
      } catch (e) {
        console.error('Failed to create offer:', e);
      }
    };

    const onOffer = async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        const answer = await voiceChat.handleOffer(from, sdp);
        signaling.emit('voice_answer', { gameId, from: currentPlayerId, to: from, sdp: answer });
      } catch (e) {
        console.error('Failed to handle offer:', e);
      }
    };

    const onAnswer = async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        await voiceChat.handleAnswer(from, sdp);
      } catch (e) {
        console.error('Failed to handle answer:', e);
      }
    };

    const onCandidate = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      try {
        await voiceChat.addIceCandidate(from, candidate);
      } catch (e) {
        console.error('Failed to add ICE candidate:', e);
      }
    };

    // Emit candidates as we get them
    voiceChat.onIceCandidate = (playerId, candidate) => {
      signaling.emit('voice_candidate', { gameId, from: currentPlayerId, to: playerId, candidate });
    };

    signaling.on('voice_join', onJoin);
    if (!fallbackEnabled) {
      signaling.on('voice_offer', onOffer);
      signaling.on('voice_answer', onAnswer);
      signaling.on('voice_candidate', onCandidate);
    }

    // Fallback: play incoming chunks
    const onChunk = ({ from, data }: { from: string; data: string }) => {
      if (from === currentPlayerId) return;
      try {
        // Mark remote participant present and connected in fallback mode
        setParticipants(prev => {
          const exists = prev.find(p => p.playerId === from);
          if (exists) {
            if (!exists.isConnected) {
              return prev.map(p => p.playerId === from ? { ...p, isConnected: true } : p);
            }
            return prev;
          }
          return [...prev, { playerId: from, playerName: from, isMuted: false, isConnected: true, volume: 1 } as any];
        });
        const url = base64ToBlobUrl(data);
        const audio = new Audio();
        (audio as any).playsInline = true;
        audio.src = url;
        audio.autoplay = true;
        audio.muted = false;
        audio.play().catch(() => {});
        // Revoke after a while
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch {}
    };
    signaling.on('voice_chunk', onChunk);

    return () => {
      // No off() helper exposed; if available use it. Otherwise, rely on page remount to clear.
    };
  }, [signaling, isJoined, currentPlayerId, gameId, voiceChat, fallbackEnabled]);

  return {
    isSupported: VoiceChatManager.isSupported(),
    isInitialized,
    isJoined,
    participants,
    error,
    initialize,
    join,
    leave,
    toggleMute,
    setParticipantVolume,
    getLocalStream: () => (voiceChat as any).getLocalStream() as MediaStream | null,
  };
}
