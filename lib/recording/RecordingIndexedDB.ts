/**
 * TopPlaced AI — Resilient Recording IndexedDB Storage
 * 
 * Stores 10-second progressive recording chunks locally in browser persistent storage.
 * Ensures chunks survive network disconnects, tab refresh, or transient upload failures.
 */

export interface StoredChunk {
  sessionId: string;
  sequenceIndex: number;
  blob: Blob;
  sizeBytes: number;
  sha256: string;
  status: "pending" | "uploading" | "uploaded" | "failed";
  retryCount: number;
  lastAttemptAt?: number;
  error?: string;
  createdAt: number;
}

const DB_NAME = "TopPlacedRecordingDB";
const DB_VERSION = 1;
const STORE_NAME = "recording_chunks";

class RecordingIndexedDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined" || !window.indexedDB) {
      throw new Error("IndexedDB is not supported in this browser environment.");
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, {
              keyPath: ["sessionId", "sequenceIndex"],
            });
            store.createIndex("by_session", "sessionId", { unique: false });
            store.createIndex("by_session_status", ["sessionId", "status"], { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          this.dbPromise = null;
          reject(request.error || new Error("Failed to open IndexedDB"));
        };
      });
    }

    return this.dbPromise;
  }

  public async saveChunk(chunk: StoredChunk): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(chunk);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getPendingChunks(
    sessionId: string,
    includeStuckUploading: boolean = true
  ): Promise<StoredChunk[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("by_session");
      const req = index.getAll(IDBKeyRange.only(sessionId));

      req.onsuccess = () => {
        const all: StoredChunk[] = req.result || [];
        const now = Date.now();
        const pending = all
          .filter(
            (c) =>
              c.status === "pending" ||
              c.status === "failed" ||
              (includeStuckUploading &&
                c.status === "uploading" &&
                (!c.lastAttemptAt || now - c.lastAttemptAt > 15000))
          )
          .sort((a, b) => a.sequenceIndex - b.sequenceIndex);
        resolve(pending);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getSessionsWithPendingChunks(): Promise<string[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const all: StoredChunk[] = req.result || [];
        const sessions = new Set<string>();
        all.forEach((c) => {
          if (c.status !== "uploaded") {
            sessions.add(c.sessionId);
          }
        });
        resolve(Array.from(sessions));
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getAllSessionChunks(sessionId: string): Promise<StoredChunk[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("by_session");
      const req = index.getAll(IDBKeyRange.only(sessionId));

      req.onsuccess = () => {
        const all: StoredChunk[] = req.result || [];
        all.sort((a, b) => a.sequenceIndex - b.sequenceIndex);
        resolve(all);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async markChunkStatus(
    sessionId: string,
    sequenceIndex: number,
    status: "uploading" | "uploaded" | "failed",
    errorMsg?: string
  ): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get([sessionId, sequenceIndex]);

      getReq.onsuccess = () => {
        const chunk = getReq.result as StoredChunk | undefined;
        if (!chunk) {
          resolve();
          return;
        }
        chunk.status = status;
        chunk.lastAttemptAt = Date.now();
        if (status === "failed") {
          chunk.retryCount = (chunk.retryCount || 0) + 1;
          chunk.error = errorMsg;
        }
        const putReq = store.put(chunk);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  public async pruneUploadedChunks(sessionId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("by_session");
      const req = index.getAll(IDBKeyRange.only(sessionId));

      req.onsuccess = () => {
        const chunks: StoredChunk[] = req.result || [];
        chunks.forEach((c) => {
          if (c.status === "uploaded") {
            store.delete([c.sessionId, c.sequenceIndex]);
          }
        });
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async clearSession(sessionId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("by_session");
      const req = index.getAllKeys(IDBKeyRange.only(sessionId));

      req.onsuccess = () => {
        const keys = req.result || [];
        keys.forEach((key) => store.delete(key));
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export const recordingIndexedDB = new RecordingIndexedDB();
