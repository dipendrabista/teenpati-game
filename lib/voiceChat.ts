// WebRTC Voice Chat System for Teen Patti
export interface VoiceChatParticipant {
  playerId: string;
  playerName: string;
  stream?: MediaStream;
  isMuted: boolean;
  isConnected: boolean;
  volume: number;
}

export interface VoiceChatConfig {
  audioConstraints: MediaTrackConstraints;
  iceServers: RTCConfiguration['iceServers'];
}

export class VoiceChatManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private participants: Map<string, VoiceChatParticipant> = new Map();
  private isInitialized = false;
  private isMuted = false;
  private volume = 1.0;

  private config: VoiceChatConfig = {
    audioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100,
      sampleSize: 16,
      channelCount: 1,
    },
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor(config?: Partial<VoiceChatConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Initialize voice chat
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: this.config.audioConstraints,
        video: false,
      });

      this.isInitialized = true;
      console.log('🎤 Voice chat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize voice chat:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  // Join voice chat room
  async joinRoom(playerId: string, playerName: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Voice chat not initialized');
    }

    const participant: VoiceChatParticipant = {
      playerId,
      playerName,
      stream: this.localStream!,
      isMuted: this.isMuted,
      isConnected: true,
      volume: this.volume,
    };

    this.participants.set(playerId, participant);
    console.log(`🎤 ${playerName} joined voice chat`);
  }

  // Leave voice chat room
  async leaveRoom(): Promise<void> {
    // Stop all peer connections
    for (const [playerId, pc] of this.peerConnections) {
      pc.close();
    }
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.participants.clear();
    this.isInitialized = false;
    console.log('🎤 Left voice chat room');
  }

  // Create peer connection for a participant
  async createPeerConnection(remotePlayerId: string): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // Ensure a participant entry exists for the remote peer so UI can reflect "2 connected"
    if (!this.participants.has(remotePlayerId)) {
      const participant: VoiceChatParticipant = {
        playerId: remotePlayerId,
        playerName: remotePlayerId, // fallback; UI can update name when known
        isMuted: false,
        isConnected: false,
        volume: 1.0,
      };
      this.participants.set(remotePlayerId, participant);
      this.onParticipantJoined?.(participant);
    }

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer via signaling server
        this.onIceCandidate?.(remotePlayerId, event.candidate);
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const participant = this.participants.get(remotePlayerId);
      if (participant) {
        participant.stream = event.streams[0];
        this.onRemoteStream?.(remotePlayerId, event.streams[0]);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const participant = this.participants.get(remotePlayerId);
      if (participant) {
        participant.isConnected = pc.connectionState === 'connected';
        this.onConnectionStateChange?.(remotePlayerId, pc.connectionState);
      }
    };

    this.peerConnections.set(remotePlayerId, pc);
    return pc;
  }

  // Create offer for WebRTC connection
  async createOffer(remotePlayerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = await this.createPeerConnection(remotePlayerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  // Handle incoming offer
  async handleOffer(remotePlayerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = await this.createPeerConnection(remotePlayerId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  // Handle incoming answer
  async handleAnswer(remotePlayerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(remotePlayerId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  // Add ICE candidate
  async addIceCandidate(remotePlayerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(remotePlayerId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // Mute/unmute local audio
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted;
      });
    }

    // Update local participant
    const localParticipant = Array.from(this.participants.values()).find(p => p.stream === this.localStream);
    if (localParticipant) {
      localParticipant.isMuted = this.isMuted;
    }

    console.log(`🎤 ${this.isMuted ? 'Muted' : 'Unmuted'} local audio`);
    return this.isMuted;
  }

  // Set volume for remote participant
  setParticipantVolume(playerId: string, volume: number): void {
    const participant = this.participants.get(playerId);
    if (participant && participant.stream) {
      participant.volume = Math.max(0, Math.min(1, volume));

      // Apply volume to audio elements
      const audioElements = document.querySelectorAll(`audio[data-player-id="${playerId}"]`);
      audioElements.forEach((audio) => {
        if (audio instanceof HTMLAudioElement) {
          audio.volume = participant.volume;
        }
      });
    }
  }

  // Get participant info
  getParticipant(playerId: string): VoiceChatParticipant | undefined {
    return this.participants.get(playerId);
  }

  // Get all participants
  getAllParticipants(): VoiceChatParticipant[] {
    return Array.from(this.participants.values());
  }

  // Get local stream for mic tests/meters
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Check if voice chat is supported
  static isSupported(): boolean {
    const hasNavigator = typeof navigator !== 'undefined';
    const hasWindow = typeof window !== 'undefined';
    const hasGetUserMedia = hasNavigator && !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
    const hasRTCPeer = hasWindow && typeof (window as any).RTCPeerConnection !== 'undefined';
    return hasGetUserMedia && hasRTCPeer;
  }

  // Event handlers (to be set by the UI)
  onRemoteStream?: (playerId: string, stream: MediaStream) => void;
  onIceCandidate?: (playerId: string, candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (playerId: string, state: RTCPeerConnectionState) => void;
  onParticipantJoined?: (participant: VoiceChatParticipant) => void;
  onParticipantLeft?: (playerId: string) => void;
  onMuteStateChanged?: (playerId: string, isMuted: boolean) => void;
}

// Types are exported at the top of the file
