/**
 * TopPlaced AI - Resilient Cross-Browser Fullscreen Helper
 * Provides vendor-prefixed Fullscreen API handling, user-gesture verification,
 * state synchronization, and reliable error reporting.
 */

export function isDocumentFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as any;
  return Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

export async function enterFullscreen(element: Element = document.documentElement): Promise<boolean> {
  if (typeof document === "undefined" || !element) return false;

  // If already fullscreen, verify and return true
  if (isDocumentFullscreen()) {
    return true;
  }

  const el = element as any;
  const requestFn =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;

  if (!requestFn) {
    console.warn("[FullscreenHelper] Fullscreen API is not supported in this browser.");
    return false;
  }

  try {
    const promise = requestFn.call(el);
    if (promise && typeof promise.then === "function") {
      await promise;
    }
    // Verify that fullscreen actually took effect
    return isDocumentFullscreen();
  } catch (err) {
    console.warn("[FullscreenHelper] requestFullscreen failed or was blocked by browser:", err);
    return false;
  }
}

export async function exitFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return true;

  if (!isDocumentFullscreen()) {
    return true;
  }

  const doc = document as any;
  const exitFn =
    doc.exitFullscreen ||
    doc.webkitExitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.msExitFullscreen;

  if (!exitFn) {
    return false;
  }

  try {
    const promise = exitFn.call(doc);
    if (promise && typeof promise.then === "function") {
      await promise;
    }
    return !isDocumentFullscreen();
  } catch (err) {
    console.warn("[FullscreenHelper] exitFullscreen failed:", err);
    return false;
  }
}

export function subscribeToFullscreenChanges(
  onChange: (isFullscreen: boolean) => void,
  onError?: (err: Event) => void
): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }

  const handleEvent = () => {
    const active = isDocumentFullscreen();
    onChange(active);
  };

  const handleError = (e: Event) => {
    if (onError) onError(e);
  };

  const events = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
  ];

  const errorEvents = [
    "fullscreenerror",
    "webkitfullscreenerror",
    "mozfullscreenerror",
    "MSFullscreenError",
  ];

  events.forEach((evt) => {
    document.addEventListener(evt, handleEvent, false);
  });

  errorEvents.forEach((evt) => {
    document.addEventListener(evt, handleError, false);
  });

  return () => {
    events.forEach((evt) => {
      document.removeEventListener(evt, handleEvent, false);
    });
    errorEvents.forEach((evt) => {
      document.removeEventListener(evt, handleError, false);
    });
  };
}
