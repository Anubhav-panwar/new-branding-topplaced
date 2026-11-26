/**
 * TopPlaced AI — Progressive Resilient Recording Manager
 * 
 * Coordinates:
 * 1. 10-Second MediaRecorder chunk slicing
 * 2. Immediate persistent caching in IndexedDB
 * 3. Asynchronous sequential chunk upload with exponential backoff
 * 4. Automatic reconnection & recovery after network drops or tab refresh
 * 5. Atomic server-side finalization
 */

import { recordingIndexedDB, StoredChunk } from "./RecordingIndexedDB";

export interface RecordingManagerConfig {
  sessionId: string;
  apiBaseUrl: string;
  token?: string;
  chunkDurationMs?: number; // default: 10000ms (10 seconds)
  onUploadProgress?: (progress: { uploadedChunks: number; totalChunks: number; percentage: number }) => void;
  onError?: (error: Error) => void;
}

export class ProgressiveRecordingManager {
  private config: RecordingManagerConfig;
  private recorder: MediaRecorder | null = null;
  private sequenceIndex: number = 0;
  private isFinalizing: boolean = false;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private stopTime: number = 0;

  private uploadQueueRunning: boolean = false;
  private isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;
  private pendingChunkWrites: Set<Promise<void>> = new Set();
  private uploadQueuePromise: Promise<void> | null = null;
  private selectedMimeType: string = "video/webm";

  constructor(config: RecordingManagerConfig) {
    this.config = {
      ...config,
      chunkDurationMs: config.chunkDurationMs || 10000,
      apiBaseUrl: config.apiBaseUrl.replace(/\/$/, ""),
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    console.log("🌐 Network reconnected! Resuming progressive chunk uploads for session:", this.config.sessionId);
    this.processUploadQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
    console.warn("⚠️ Network offline! Chunks will be safely persisted in IndexedDB.");
  };

  public async start(stream: MediaStream): Promise<void> {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      throw new Error("MediaRecorder not supported.");
    }

    if (this.isRunning) return;

    this.sequenceIndex = 0;
    this.isFinalizing = false;
    this.isRunning = true;
    this.startTime = Date.now();
    this.pendingChunkWrites.clear();

    // Check existing chunks from earlier refresh to avoid index collisions
    try {
      const existing = await recordingIndexedDB.getAllSessionChunks(this.config.sessionId);
      if (existing.length > 0) {
        this.sequenceIndex = Math.max(...existing.map((c) => c.sequenceIndex)) + 1;
        console.log(`Resuming recording session from sequence index: ${this.sequenceIndex}`);
      }
    } catch (e) {
      console.warn("Could not inspect existing session chunks:", e);
    }

    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
      "audio/webm;codecs=opus",
    ];
    let selectedMime = "video/webm";
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        selectedMime = t;
        break;
      }
    }
    this.selectedMimeType = selectedMime;

    const options: MediaRecorderOptions = { mimeType: selectedMime };
    this.recorder = new MediaRecorder(stream, options);

    this.recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) {
        const writePromise = this.handleChunkData(e.data).finally(() => {
          this.pendingChunkWrites.delete(writePromise);
        });
        this.pendingChunkWrites.add(writePromise);
      }
    };

    this.recorder.onerror = (event: any) => {
      console.warn("Progressive MediaRecorder error:", event);
      this.config.onError?.(new Error("MediaRecorder encountered an error."));
    };

    // 10-second progressive chunk slices
    this.recorder.start(this.config.chunkDurationMs);
    console.log(`🎥 Progressive Recording started (10s slices, MIME: ${selectedMime})`);

    // Process any lingering pending chunks from previous tab sessions
    this.processUploadQueue();
  }

  public flushOnUnload(): void {
    try {
      if (this.recorder && this.recorder.state === "recording") {
        this.recorder.requestData();
      }
    } catch {}
  }

  private async computeSHA256(blob: Blob): Promise<string> {
    try {
      if (typeof crypto !== "undefined" && crypto.subtle) {
        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    } catch {}
    return "";
  }

  private async handleChunkData(blob: Blob, isLast: boolean = false): Promise<void> {
    const seq = this.sequenceIndex++;
    const sha256 = await this.computeSHA256(blob);

    const chunk: StoredChunk = {
      sessionId: this.config.sessionId,
      sequenceIndex: seq,
      blob,
      sizeBytes: blob.size,
      sha256,
      status: "pending",
      retryCount: 0,
      createdAt: Date.now(),
    };

    // 1. Immediately cache in IndexedDB
    try {
      await recordingIndexedDB.saveChunk(chunk);
    } catch (dbErr) {
      console.warn("Failed to save chunk in IndexedDB:", dbErr);
    }

    // 2. Trigger asynchronous upload worker
    this.processUploadQueue();
  }

  public async processUploadQueue(includeAllUploading: boolean = false): Promise<void> {
    if (this.uploadQueuePromise) {
      return this.uploadQueuePromise;
    }
    if (!this.isOnline) return;
    this.uploadQueueRunning = true;

    this.uploadQueuePromise = (async () => {
      try {
        while (this.isOnline) {
          const pending = await recordingIndexedDB.getPendingChunks(
            this.config.sessionId,
            true
          );
          const queueList = includeAllUploading
            ? pending
            : pending;
          if (queueList.length === 0) break;

          const chunk = queueList[0];
          const success = await this.uploadSingleChunk(chunk);

          if (!success) {
            const backoffMs = Math.min(16000, 1000 * Math.pow(2, Math.min(chunk.retryCount || 1, 4)));
            console.warn(`Chunk ${chunk.sequenceIndex} failed. Retrying in ${backoffMs}ms...`);
            await new Promise((r) => setTimeout(r, backoffMs));
            break;
          }

          if (this.config.onUploadProgress) {
            const allChunks = await recordingIndexedDB.getAllSessionChunks(this.config.sessionId);
            const uploaded = allChunks.filter((c) => c.status === "uploaded").length;
            const total = Math.max(allChunks.length, this.sequenceIndex);
            this.config.onUploadProgress({
              uploadedChunks: uploaded,
              totalChunks: total,
              percentage: total > 0 ? Math.round((uploaded / total) * 100) : 0,
            });
          }
        }
      } catch (e) {
        console.warn("Error in progressive upload loop:", e);
      } finally {
        this.uploadQueueRunning = false;
        this.uploadQueuePromise = null;
      }
    })();

    return this.uploadQueuePromise;
  }

  private async uploadSingleChunk(chunk: StoredChunk): Promise<boolean> {
    await recordingIndexedDB.markChunkStatus(chunk.sessionId, chunk.sequenceIndex, "uploading");

    const formData = new FormData();
    formData.append("sequence_index", String(chunk.sequenceIndex));
    if (chunk.sha256) formData.append("chunk_hash", chunk.sha256);
    formData.append("is_last", String(this.isFinalizing && chunk.sequenceIndex === this.sequenceIndex - 1));
    formData.append("file", chunk.blob, `chunk_${String(chunk.sequenceIndex).padStart(6, "0")}.part`);

    const token =
      this.config.token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("access_token") || ""
        : "");

    const url = `${this.config.apiBaseUrl}/interview/${this.config.sessionId}/recording/chunk`;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 25000) : null;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
        ...(controller ? { signal: controller.signal } : {}),
      });

      if (res.ok) {
        await recordingIndexedDB.markChunkStatus(chunk.sessionId, chunk.sequenceIndex, "uploaded");
        return true;
      } else {
        const errorText = await res.text().catch(() => "");
        console.warn(`Chunk ${chunk.sequenceIndex} upload returned status ${res.status}: ${errorText}`);
        await recordingIndexedDB.markChunkStatus(chunk.sessionId, chunk.sequenceIndex, "failed", errorText);
        return false;
      }
    } catch (netErr: any) {
      console.warn(`Network error uploading chunk ${chunk.sequenceIndex}:`, netErr);
      await recordingIndexedDB.markChunkStatus(chunk.sessionId, chunk.sequenceIndex, "failed", netErr?.message);
      return false;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  public async stopAndFinalize(): Promise<{
    success: boolean;
    duration: number;
    isFullyProcessed?: boolean;
    processingStatus?: string;
    recordingStatus?: string;
    reportStatus?: string;
  }> {
    if (!this.isRunning) return { success: false, duration: 0 };
    this.isRunning = false;
    this.isFinalizing = true;
    this.stopTime = Date.now();
    const durationSeconds = Math.max(1, Math.round((this.stopTime - this.startTime) / 1000));

    // Stop recorder and flush final trailing chunk before exiting
    if (this.recorder && this.recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        if (!this.recorder) return resolve();
        let resolved = false;
        const finishStop = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };
        this.recorder.onstop = finishStop;
        try {
          if (this.recorder.state === "recording") {
            try {
              this.recorder.requestData();
            } catch {}
          }
          this.recorder.stop();
        } catch {
          finishStop();
        }
        setTimeout(finishStop, 4000);
      });
    }

    // Wait for all queued IndexedDB chunk writes (especially final ondataavailable chunk!)
    if (this.pendingChunkWrites.size > 0) {
      try {
        await Promise.all(Array.from(this.pendingChunkWrites));
      } catch {}
    }

    if (this.sequenceIndex === 0) {
      console.warn("ProgressiveRecordingManager: zero chunks recorded before stop.");
      return { success: false, duration: durationSeconds };
    }

    console.log(`Finalizing recording (${this.sequenceIndex} total chunks, duration: ${durationSeconds}s)...`);

    // Wait for any in-flight upload then drain remaining pending/failed chunks (up to 45s)
    if (this.uploadQueuePromise) {
      try {
        await this.uploadQueuePromise;
      } catch {}
    }

    const drainTimeout = Date.now() + 45000;
    // Ensure a stale "offline" event never blocks explicit finalize-time chunk draining
    this.isOnline = true;
    while (Date.now() < drainTimeout) {
      const pending = await recordingIndexedDB.getPendingChunks(this.config.sessionId, true);
      if (pending.length === 0) break;
      await this.processUploadQueue(true);
      const stillPending = await recordingIndexedDB.getPendingChunks(this.config.sessionId, true);
      if (stillPending.length === 0) break;
      await new Promise((r) => setTimeout(r, 1000));
    }

    const remainingBeforeFinalize = await recordingIndexedDB.getPendingChunks(this.config.sessionId, true);
    if (remainingBeforeFinalize.length > 0) {
      console.warn(`Unable to upload ${remainingBeforeFinalize.length} chunk(s) before finalization; keeping them in IndexedDB for recovery.`);
      return { success: false, duration: durationSeconds };
    }

    // Call backend finalize endpoint with retry tolerance
    const token =
      this.config.token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("access_token") || ""
        : "");

    const finalizeUrl = `${this.config.apiBaseUrl}/interview/${this.config.sessionId}/recording/finalize`;
    const mimeType = this.recorder?.mimeType || this.selectedMimeType || "video/webm";

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(finalizeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            totalChunks: this.sequenceIndex,
            durationSeconds: durationSeconds,
            mimeType,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          console.log("✅ Recording finalized and validated successfully:", data);
          await recordingIndexedDB.clearSession(this.config.sessionId);
          return {
            success: true,
            duration: data?.duration || durationSeconds,
            isFullyProcessed: Boolean(data?.isFullyProcessed),
            processingStatus: data?.processingStatus,
            recordingStatus: data?.recordingStatus,
            reportStatus: data?.reportStatus,
          };
        }
        const errData = await res.json().catch(() => ({}));
        console.warn(`Backend recording finalize attempt ${attempt} failed:`, res.status, errData);
        if (res.status >= 400 && res.status < 500 && res.status !== 409 && res.status !== 429) {
          return { success: false, duration: durationSeconds };
        }
      } catch (e) {
        console.warn(`Error calling recording finalize (attempt ${attempt}):`, e);
      }
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }

    return { success: false, duration: durationSeconds };
  }

  public destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    if (this.recorder && this.recorder.state !== "inactive") {
      try {
        this.recorder.stop();
      } catch {}
    }
    this.recorder = null;
    this.isRunning = false;
  }
}

/**
 * Attempts recovery upload + finalization for an interrupted session whose chunks remain in IndexedDB.
 */
export async function recoverPendingSessionRecording(params: {
  sessionId: string;
  apiBaseUrl: string;
  token?: string;
}): Promise<boolean> {
  if (typeof window === "undefined" || !params.sessionId) return false;
  try {
    const allChunks = await recordingIndexedDB.getAllSessionChunks(params.sessionId);
    if (!allChunks || allChunks.length === 0) return false;

    const apiBase = params.apiBaseUrl.replace(/\/$/, "");
    const effectiveToken =
      params.token ||
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      "";

    for (const chunk of allChunks) {
      if (chunk.status === "uploaded") continue;
      const formData = new FormData();
      formData.append("sequence_index", String(chunk.sequenceIndex));
      if (chunk.sha256) formData.append("chunk_hash", chunk.sha256);
      formData.append("is_last", String(chunk.sequenceIndex === allChunks.length - 1));
      formData.append("file", chunk.blob, `chunk_${String(chunk.sequenceIndex).padStart(6, "0")}.part`);

      const res = await fetch(`${apiBase}/interview/${params.sessionId}/recording/chunk`, {
        method: "POST",
        headers: {
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
        },
        body: formData,
      });
      if (!res.ok) return false;
      await recordingIndexedDB.markChunkStatus(params.sessionId, chunk.sequenceIndex, "uploaded");
    }

    const estDuration = Math.max(1, allChunks.length * 10);
    const finalizeRes = await fetch(`${apiBase}/interview/${params.sessionId}/recording/finalize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
      },
      body: JSON.stringify({
        totalChunks: Math.max(...allChunks.map((c) => c.sequenceIndex)) + 1,
        durationSeconds: estDuration,
        mimeType: allChunks[0]?.blob?.type || "video/webm",
      }),
    });

    if (finalizeRes.ok) {
      await recordingIndexedDB.clearSession(params.sessionId);
      console.log(`✅ Recovered and finalized interrupted recording for session ${params.sessionId}`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn("Pending recording recovery skipped:", err);
    return false;
  }
}
