/**
 * Camera Health Monitor
 * Continuously tracks track liveness, black frames, frozen video, and hardware disconnects.
 */

import { CameraHealthState } from "./types";

export class CameraHealthMonitor {
  private lastHealthyState: CameraHealthState = "CAMERA_OK";
  private consecutiveBlackFrames = 0;
  private consecutiveFrozenFrames = 0;
  private prevFrameChecksum = 0;
  private onStateChangeCallback: ((state: CameraHealthState) => void) | null = null;

  constructor(onStateChange?: (state: CameraHealthState) => void) {
    if (onStateChange) {
      this.onStateChangeCallback = onStateChange;
    }
  }

  public checkHealth(
    videoElement: HTMLVideoElement | null,
    stream: MediaStream | null,
    avgLuminance: number,
    frameDelta: number
  ): CameraHealthState {
    if (!stream) {
      return this.updateState("CAMERA_DISCONNECTED");
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState !== "live" || videoTrack.muted || !videoTrack.enabled) {
      return this.updateState("CAMERA_DISCONNECTED");
    }

    // Virtual Camera detection (OBS, ManyCam, DroidCam, Camo, etc.)
    const trackLabel = (videoTrack.label || "").toLowerCase();
    const isVirtual = [
      "obs",
      "virtual",
      "manycam",
      "droidcam",
      "camo",
      "vmix",
      "fake",
      "splitcam",
      "ndi",
      "elgato virtual",
      "streamlabs",
      "prism",
      "epoccam",
      "iriun",
    ].some((kw) => trackLabel.includes(kw));

    if (isVirtual) {
      return this.updateState("VIRTUAL_CAMERA_DETECTED");
    }

    if (!videoElement || videoElement.readyState < 2 || videoElement.paused) {
      return this.updateState("NO_VIDEO_FRAME");
    }

    // Black frame check (< 16 out of 255 luminance for > 1.0s = 5 frames at 5fps)
    if (avgLuminance < 16) {
      this.consecutiveBlackFrames++;
      if (this.consecutiveBlackFrames >= 5) {
        return this.updateState("BLACK_FRAME");
      }
    } else {
      this.consecutiveBlackFrames = 0;
    }

    // Frozen frame check (frame delta is 0 for > 3s)
    if (frameDelta === 0) {
      this.consecutiveFrozenFrames++;
      if (this.consecutiveFrozenFrames >= 15) { // ~3 seconds at 5fps
        return this.updateState("NO_VIDEO_FRAME");
      }
    } else {
      this.consecutiveFrozenFrames = 0;
    }

    return this.updateState("CAMERA_OK");
  }

  private updateState(newState: CameraHealthState): CameraHealthState {
    if (newState !== this.lastHealthyState) {
      this.lastHealthyState = newState;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(newState);
      }
    }
    return newState;
  }

  public getHealthyState(): CameraHealthState {
    return this.lastHealthyState;
  }

  public reset() {
    this.consecutiveBlackFrames = 0;
    this.consecutiveFrozenFrames = 0;
    this.lastHealthyState = "CAMERA_OK";
  }
}
