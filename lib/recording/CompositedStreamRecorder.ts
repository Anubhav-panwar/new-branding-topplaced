/**
 * TopPlaced AI — Composited Stream Recorder (Option A)
 * 
 * Merges candidate screen share with webcam video in Picture-in-Picture (PiP)
 * and mixes all microphone/system audio tracks into a unified 720p 25fps MediaStream.
 */

export interface CompositedRecorderOptions {
  width?: number;
  height?: number;
  frameRate?: number;
}

export class CompositedStreamRecorder {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private screenVideo: HTMLVideoElement | null = null;
  private webcamVideo: HTMLVideoElement | null = null;

  private screenStream: MediaStream | null = null;
  private webcamStream: MediaStream | null = null;
  private audioStream: MediaStream | null = null;
  private remoteAudioStreams: Set<MediaStream> = new Set();

  private compositedStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private activeAudioSources: AudioNode[] = [];

  private isRunning: boolean = false;
  private animFrameId: number | null = null;

  private width: number = 1280;
  private height: number = 720;
  private frameRate: number = 25;

  constructor(options?: CompositedRecorderOptions) {
    if (options?.width) this.width = options.width;
    if (options?.height) this.height = options.height;
    if (options?.frameRate) this.frameRate = options.frameRate;
  }

  public initialize(
    webcamStream: MediaStream | null,
    screenStream: MediaStream | null,
    audioStream: MediaStream | null
  ): MediaStream {
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error("CompositedStreamRecorder requires a browser DOM environment.");
    }

    this.webcamStream = webcamStream;
    this.screenStream = screenStream;
    this.audioStream = audioStream;

    // Create offscreen canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d", { alpha: false });

    // Create hidden video elements to play frames for canvas drawing
    this.screenVideo = document.createElement("video");
    this.screenVideo.muted = true;
    this.screenVideo.playsInline = true;
    this.screenVideo.autoplay = true;

    this.webcamVideo = document.createElement("video");
    this.webcamVideo.muted = true;
    this.webcamVideo.playsInline = true;
    this.webcamVideo.autoplay = true;

    this.bindVideoStream(this.screenVideo, this.screenStream);
    this.bindVideoStream(this.webcamVideo, this.webcamStream);

    // Capture canvas video stream
    const canvasStream = this.canvas.captureStream(this.frameRate);
    this.compositedStream = new MediaStream();

    // Add canvas video track
    canvasStream.getVideoTracks().forEach((track) => {
      this.compositedStream?.addTrack(track);
    });

    // Initialize persistent audio destination ONCE so MediaRecorder never sees track removal mid-session
    if (typeof window !== "undefined") {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          if (this.audioContext.state === "suspended") {
            this.audioContext.resume().catch(() => {});
          }
          this.audioDestination = this.audioContext.createMediaStreamDestination();
          this.audioDestination.stream.getAudioTracks().forEach((track) => {
            this.compositedStream?.addTrack(track);
          });
        }
      } catch (e) {
        console.warn("CompositedStreamRecorder: AudioContext init notice", e);
      }
    }

    // Set up audio mixing
    this.setupAudioMixing();

    // Start drawing loop
    this.isRunning = true;
    this.renderLoop();

    return this.compositedStream;
  }

  private bindVideoStream(videoEl: HTMLVideoElement, stream: MediaStream | null) {
    if (!videoEl) return;
    if (stream && stream.getVideoTracks().length > 0) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
        videoEl.play().catch(() => {});
      }
    } else {
      videoEl.srcObject = null;
    }
  }

  public updateScreenStream(stream: MediaStream | null) {
    this.screenStream = stream;
    if (this.screenVideo) {
      this.bindVideoStream(this.screenVideo, stream);
    }
    this.setupAudioMixing();
  }

  public updateWebcamStream(stream: MediaStream | null) {
    this.webcamStream = stream;
    if (this.webcamVideo) {
      this.bindVideoStream(this.webcamVideo, stream);
    }
  }

  public updateAudioStream(stream: MediaStream | null) {
    this.audioStream = stream;
    this.setupAudioMixing();
  }

  public addRemoteAudioStream(stream: MediaStream | null) {
    if (!stream || stream.getAudioTracks().length === 0) return;
    if (!this.remoteAudioStreams.has(stream)) {
      this.remoteAudioStreams.add(stream);
      this.setupAudioMixing();
    }
  }

  public removeRemoteAudioStream(stream: MediaStream | null) {
    if (!stream) return;
    if (this.remoteAudioStreams.delete(stream)) {
      this.setupAudioMixing();
    }
  }

  private setupAudioMixing() {
    if (typeof window === "undefined" || !this.compositedStream) return;

    // Disconnect previously wired audio source nodes without stopping/removing destination output track
    this.activeAudioSources.forEach((node) => {
      try {
        node.disconnect();
      } catch {}
    });
    this.activeAudioSources = [];

    if (!this.audioContext || !this.audioDestination || this.audioContext.state === "closed") {
      // Fallback only if AudioContext is unavailable
      if (this.compositedStream.getAudioTracks().length === 0) {
        const micTracks = this.audioStream?.getAudioTracks() || [];
        micTracks.forEach((t) => this.compositedStream?.addTrack(t.clone()));
      }
      return;
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }

    const connectStream = (stream: MediaStream | null, label: string) => {
      if (!stream || !this.audioContext || !this.audioDestination) return;
      const liveAudioTracks = stream.getAudioTracks().filter((t) => t.readyState === "live");
      if (liveAudioTracks.length === 0) return;
      try {
        const src = this.audioContext.createMediaStreamSource(new MediaStream(liveAudioTracks));
        src.connect(this.audioDestination);
        this.activeAudioSources.push(src);
      } catch (err) {
        console.warn(`CompositedStreamRecorder: ${label} audio connect skipped`, err);
      }
    };

    connectStream(this.audioStream, "microphone");
    connectStream(this.screenStream, "screen");
    this.remoteAudioStreams.forEach((remoteStream) => {
      connectStream(remoteStream, "remote-ai");
    });
  }

  private renderLoop = () => {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const hasLiveScreen =
      this.screenStream &&
      this.screenStream.getVideoTracks().length > 0 &&
      this.screenStream.getVideoTracks()[0].readyState === "live" &&
      this.screenVideo &&
      this.screenVideo.readyState >= 2;

    const hasLiveWebcam =
      this.webcamStream &&
      this.webcamStream.getVideoTracks().length > 0 &&
      this.webcamStream.getVideoTracks()[0].readyState === "live" &&
      this.webcamVideo &&
      this.webcamVideo.readyState >= 2;

    // Background clearing
    ctx.fillStyle = "#0A0D12";
    ctx.fillRect(0, 0, w, h);

    if (hasLiveScreen && this.screenVideo) {
      // 1. Draw Screen as full-canvas base
      ctx.drawImage(this.screenVideo, 0, 0, w, h);

      // 2. Overlay Candidate Webcam in PiP (Bottom-Right)
      if (hasLiveWebcam && this.webcamVideo) {
        const pipW = 280;
        const pipH = 175;
        const pad = 24;
        const x = w - pipW - pad;
        const y = h - pipH - pad;
        const r = 12;

        ctx.save();
        // PiP Drop Shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Rounded Clip
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + pipW - r, y);
        ctx.quadraticCurveTo(x + pipW, y, x + pipW, y + r);
        ctx.lineTo(x + pipW, y + pipH - r);
        ctx.quadraticCurveTo(x + pipW, y + pipH, x + pipW - r, y + pipH);
        ctx.lineTo(x + r, y + pipH);
        ctx.quadraticCurveTo(x, y + pipH, x, y + pipH - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        ctx.fillStyle = "#000000";
        ctx.fill();
        ctx.clip();

        // Draw Webcam inside PiP
        ctx.drawImage(this.webcamVideo, x, y, pipW, pipH);
        ctx.restore();

        // PiP Accent Border
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + pipW - r, y);
        ctx.quadraticCurveTo(x + pipW, y, x + pipW, y + r);
        ctx.lineTo(x + pipW, y + pipH - r);
        ctx.quadraticCurveTo(x + pipW, y + pipH, x + pipW - r, y + pipH);
        ctx.lineTo(x + r, y + pipH);
        ctx.quadraticCurveTo(x, y + pipH, x, y + pipH - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(0, 255, 178, 0.85)";
        ctx.stroke();
        ctx.restore();
      }
    } else if (hasLiveWebcam && this.webcamVideo) {
      // Screen not active: Draw Webcam Fullscreen as base
      ctx.drawImage(this.webcamVideo, 0, 0, w, h);
    } else {
      // Neither video track active: standby slate
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#00FFB2";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TopPlaced AI — Media Stream Connecting...", w / 2, h / 2);
    }

    this.animFrameId = requestAnimationFrame(this.renderLoop);
  };

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.screenVideo) {
      this.screenVideo.srcObject = null;
      this.screenVideo = null;
    }
    if (this.webcamVideo) {
      this.webcamVideo.srcObject = null;
      this.webcamVideo = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.compositedStream?.getTracks().forEach((t) => t.stop());
    this.compositedStream = null;
    this.canvas = null;
    this.ctx = null;
  }
}
