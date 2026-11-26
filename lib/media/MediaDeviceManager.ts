"use client";

/**
 * TOPPLACED AI — Media Device Manager
 * Manages verified MediaStream instances (Camera, Microphone, Screen Sharing)
 * and enables seamless, zero-reprompt transfer from Pre-Interview Setup into
 * the live interview room.
 */

export interface DeviceInfo {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface MediaDeviceState {
  // Streams
  cameraStream: MediaStream | null;
  microphoneStream: MediaStream | null;
  screenStream: MediaStream | null;

  // Selected Device IDs
  selectedCameraId: string | null;
  selectedMicrophoneId: string | null;

  // Available Devices
  cameras: DeviceInfo[];
  microphones: DeviceInfo[];

  // Readiness Status
  isCameraReady: boolean;
  isMicrophoneReady: boolean;
  isScreenReady: boolean;

  // Real-time Audio Verification
  audioLevel: number; // 0 to 100
  hasAudioInputDetected: boolean;

  // Screen Surface Proctoring Check
  screenDisplaySurface: string | null;
  isEntireScreen: boolean;

  // Errors
  cameraError: string | null;
  microphoneError: string | null;
  screenError: string | null;
}

type StateListener = (state: MediaDeviceState) => void;

class MediaDeviceManager {
  private static instance: MediaDeviceManager | null = null;

  private state: MediaDeviceState = {
    cameraStream: null,
    microphoneStream: null,
    screenStream: null,
    selectedCameraId: null,
    selectedMicrophoneId: null,
    cameras: [],
    microphones: [],
    isCameraReady: false,
    isMicrophoneReady: false,
    isScreenReady: false,
    audioLevel: 0,
    hasAudioInputDetected: false,
    screenDisplaySurface: null,
    isEntireScreen: false,
    cameraError: null,
    microphoneError: null,
    screenError: null,
  };

  private listeners: Set<StateListener> = new Set();

  // Web Audio resources for microphone level metering
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;

  public static getInstance(): MediaDeviceManager {
    if (!MediaDeviceManager.instance) {
      MediaDeviceManager.instance = new MediaDeviceManager();
    }
    return MediaDeviceManager.instance;
  }

  private constructor() {
    if (typeof window !== "undefined" && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", () => {
        this.enumerateDevices();
        this.revalidateActiveTracks();
      });
    }
  }

  public getState(): MediaDeviceState {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.warn("[MediaDeviceManager] Listener notification error:", err);
      }
    });
  }

  /**
   * Enumerate connected hardware devices
   */
  public async enumerateDevices(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras: DeviceInfo[] = devices
        .filter((d) => d.kind === "videoinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
          groupId: d.groupId,
        }));

      const microphones: DeviceInfo[] = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
          groupId: d.groupId,
        }));

      this.state.cameras = cameras;
      this.state.microphones = microphones;
      this.notify();
    } catch (err) {
      console.warn("[MediaDeviceManager] Failed to enumerate devices:", err);
    }
  }

  /**
   * Revalidate active tracks to detect sudden disconnection
   */
  public revalidateActiveTracks(): void {
    if (this.state.cameraStream) {
      const videoTracks = this.state.cameraStream.getVideoTracks();
      const isLive = videoTracks.length > 0 && videoTracks.some((t) => t.readyState === "live" && t.enabled);
      if (!isLive) {
        this.state.isCameraReady = false;
        this.state.cameraError = "Camera disconnected or track stopped.";
      }
    }

    if (this.state.microphoneStream) {
      const audioTracks = this.state.microphoneStream.getAudioTracks();
      const isLive = audioTracks.length > 0 && audioTracks.some((t) => t.readyState === "live" && t.enabled);
      if (!isLive) {
        this.state.isMicrophoneReady = false;
        this.state.microphoneError = "Microphone disconnected or track stopped.";
      }
    }

    if (this.state.screenStream) {
      const screenTracks = this.state.screenStream.getVideoTracks();
      const isLive = screenTracks.length > 0 && screenTracks.some((t) => t.readyState === "live" && t.enabled);
      if (!isLive) {
        this.state.isScreenReady = false;
        this.state.screenError = "Screen sharing stopped.";
      }
    }

    this.notify();
  }

  /**
   * Test and verify Camera stream
   */
  public async testCamera(deviceId?: string): Promise<MediaStream | null> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        this.state.cameraError = `Insecure Context (HTTP): Browser blocks camera access on ${window.location.host}. Please open http://localhost:3000 on this laptop or use HTTPS.`;
      } else {
        this.state.cameraError = "Camera API not supported in this browser.";
      }
      this.state.isCameraReady = false;
      this.notify();
      return null;
    }

    try {
      this.state.cameraError = null;

      // Stop previous camera stream if deviceId changed
      if (this.state.cameraStream) {
        this.state.cameraStream.getVideoTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = stream.getVideoTracks()[0];

      if (!videoTrack) {
        throw new Error("No active video track returned by camera.");
      }

      videoTrack.onended = () => {
        this.state.isCameraReady = false;
        this.state.cameraError = "Camera feed was stopped.";
        this.notify();
      };

      this.state.cameraStream = stream;
      this.state.selectedCameraId = deviceId || videoTrack.getSettings().deviceId || null;
      this.state.isCameraReady = true;

      await this.enumerateDevices();
      this.notify();
      return stream;
    } catch (err: any) {
      console.warn("[MediaDeviceManager] Camera test error:", err);
      this.state.isCameraReady = false;
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        this.state.cameraError = "Camera permission was denied. Please allow camera access in your browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        this.state.cameraError = "No camera hardware detected on this device.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        this.state.cameraError = "Camera is already in use by another application.";
      } else {
        this.state.cameraError = err.message || "Failed to initialize camera.";
      }
      this.notify();
      return null;
    }
  }

  /**
   * Test and verify Microphone stream with actual audio activity detection
   */
  public async testMicrophone(deviceId?: string): Promise<MediaStream | null> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        this.state.microphoneError = `Insecure Context (HTTP): Browser blocks microphone access on ${window.location.host}. Please open http://localhost:3000 on this laptop or use HTTPS.`;
      } else {
        this.state.microphoneError = "Microphone API not supported in this browser.";
      }
      this.state.isMicrophoneReady = false;
      this.notify();
      return null;
    }

    try {
      this.state.microphoneError = null;

      // Stop previous mic stream if changing device
      if (this.state.microphoneStream) {
        this.state.microphoneStream.getAudioTracks().forEach((track) => track.stop());
      }
      this.stopAudioAnalysis();

      const constraints: MediaStreamConstraints = {
        video: false,
        audio: deviceId
          ? {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioTrack = stream.getAudioTracks()[0];

      if (!audioTrack) {
        throw new Error("No active audio track returned by microphone.");
      }

      audioTrack.onended = () => {
        this.state.isMicrophoneReady = false;
        this.state.microphoneError = "Microphone input was disconnected.";
        this.notify();
      };

      this.state.microphoneStream = stream;
      this.state.selectedMicrophoneId = deviceId || audioTrack.getSettings().deviceId || null;

      // Start Web Audio API meter for actual acoustic verification
      this.startAudioAnalysis(stream);

      await this.enumerateDevices();
      this.notify();
      return stream;
    } catch (err: any) {
      console.warn("[MediaDeviceManager] Microphone test error:", err);
      this.state.isMicrophoneReady = false;
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        this.state.microphoneError = "Microphone permission was denied. Please allow microphone access in your browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        this.state.microphoneError = "No microphone hardware detected on this device.";
      } else {
        this.state.microphoneError = err.message || "Failed to initialize microphone.";
      }
      this.notify();
      return null;
    }
  }

  /**
   * Web Audio API Analysis to measure actual input volume levels
   */
  private startAudioAnalysis(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        // Fallback: mark ready if Web Audio API not supported
        this.state.hasAudioInputDetected = true;
        this.state.isMicrophoneReady = true;
        this.notify();
        return;
      }

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      this.audioSource = this.audioContext.createMediaStreamSource(stream);
      this.audioSource.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastAudioNotify = 0;

      const tick = () => {
        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const currentLevel = Math.min(100, Math.round((avg / 128) * 100));

        const levelDiff = Math.abs(currentLevel - this.state.audioLevel);
        this.state.audioLevel = currentLevel;

        let thresholdCrossed = false;
        // Acoustic threshold verification (level >= 10 indicates human voice or audible sound)
        if (currentLevel >= 10 && !this.state.hasAudioInputDetected) {
          this.state.hasAudioInputDetected = true;
          this.state.isMicrophoneReady = true;
          thresholdCrossed = true;
        }

        const now = performance.now();
        // Throttle React state updates to at most once every 120ms or when threshold triggers
        if (thresholdCrossed || (levelDiff >= 3 && now - lastAudioNotify >= 120)) {
          lastAudioNotify = now;
          this.notify();
        }

        this.animationFrameId = requestAnimationFrame(tick);
      };

      this.animationFrameId = requestAnimationFrame(tick);
    } catch (err) {
      console.warn("[MediaDeviceManager] Web Audio analysis notice:", err);
      this.state.hasAudioInputDetected = true;
      this.state.isMicrophoneReady = true;
      this.notify();
    }
  }

  private stopAudioAnalysis() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioSource) {
      try {
        this.audioSource.disconnect();
      } catch (e) {}
      this.audioSource = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
    this.analyser = null;
    this.state.audioLevel = 0;
  }

  /**
   * Test Screen Sharing via native getDisplayMedia()
   */
  public async testScreenShare(): Promise<MediaStream | null> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        this.state.screenError = `Insecure Context (HTTP): Screen sharing is blocked on ${window.location.host}. Please open http://localhost:3000 on this laptop or use HTTPS.`;
      } else {
        this.state.screenError = "Screen sharing is not supported by your browser. Please use Chrome, Edge, Brave, or Firefox.";
      }
      this.state.isScreenReady = false;
      this.notify();
      return null;
    }

    try {
      this.state.screenError = null;

      if (this.state.screenStream) {
        this.state.screenStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: { ideal: 15, max: 30 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        } as any,
        audio: false,
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error("No video track provided by screen share dialog.");
      }

      const settings = (videoTrack.getSettings ? videoTrack.getSettings() : {}) as any;
      const displaySurface = settings.displaySurface || "monitor";

      videoTrack.onended = () => {
        this.state.isScreenReady = false;
        this.state.screenStream = null;
        this.state.screenDisplaySurface = null;
        this.state.isEntireScreen = false;
        this.state.screenError = "Screen sharing was stopped.";
        this.notify();
      };

      this.state.screenStream = stream;
      this.state.screenDisplaySurface = displaySurface;
      this.state.isEntireScreen = displaySurface === "monitor";
      this.state.isScreenReady = true;
      this.notify();
      return stream;
    } catch (err: any) {
      console.warn("[MediaDeviceManager] Screen share test error:", err);
      this.state.isScreenReady = false;
      if (err.name === "NotAllowedError" || err.message?.includes("Permission denied")) {
        this.state.screenError = "Screen sharing permission was canceled or denied.";
      } else {
        this.state.screenError = err.message || "Failed to start screen sharing.";
      }
      this.notify();
      return null;
    }
  }

  /**
   * Stop Screen Sharing manually
   */
  public stopScreenShare(): void {
    if (this.state.screenStream) {
      this.state.screenStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.state.screenStream = null;
    }
    this.state.isScreenReady = false;
    this.notify();
  }

  /**
   * Check if all three required devices are verified and active
   */
  public isAllReady(): boolean {
    const cameraLive =
      this.state.isCameraReady &&
      Boolean(this.state.cameraStream?.getVideoTracks().some((t) => t.readyState === "live" && t.enabled));

    const micLive =
      this.state.isMicrophoneReady &&
      this.state.hasAudioInputDetected &&
      Boolean(this.state.microphoneStream?.getAudioTracks().some((t) => t.readyState === "live" && t.enabled));

    const screenLive =
      this.state.isScreenReady &&
      Boolean(this.state.screenStream?.getVideoTracks().some((t) => t.readyState === "live" && t.enabled));

    return Boolean(cameraLive && micLive && screenLive);
  }

  /**
   * Combine camera and microphone streams into a single composite stream
   * for passing directly to the interview room (mediaStreamRef).
   */
  public getCompositeInterviewStream(): MediaStream {
    const composite = new MediaStream();

    if (this.state.cameraStream) {
      this.state.cameraStream.getVideoTracks().forEach((track) => {
        composite.addTrack(track);
      });
    }

    if (this.state.microphoneStream) {
      this.state.microphoneStream.getAudioTracks().forEach((track) => {
        composite.addTrack(track);
      });
    }

    return composite;
  }

  /**
   * Cleanup everything (only called on interview completion or explicit leave)
   */
  public cleanupAll(): void {
    this.stopAudioAnalysis();

    if (this.state.cameraStream) {
      this.state.cameraStream.getTracks().forEach((t) => t.stop());
      this.state.cameraStream = null;
    }
    if (this.state.microphoneStream) {
      this.state.microphoneStream.getTracks().forEach((t) => t.stop());
      this.state.microphoneStream = null;
    }
    if (this.state.screenStream) {
      this.state.screenStream.getTracks().forEach((t) => t.stop());
      this.state.screenStream = null;
    }

    this.state.isCameraReady = false;
    this.state.isMicrophoneReady = false;
    this.state.isScreenReady = false;
    this.state.hasAudioInputDetected = false;
    this.state.audioLevel = 0;
    this.notify();
  }
}

export const mediaDeviceManager = MediaDeviceManager.getInstance();
