export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

/** Seeks a video element and resolves once the frame at that time is
 * actually decoded and ready to draw — `currentTime` alone races the decoder. */
export function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const safeDuration = isFinite(video.duration) ? video.duration : 0;
    const safeTime = isFinite(time) ? time : 0;
    const clamped = Math.min(Math.max(0, safeTime), safeDuration);
    if (Math.abs(video.currentTime - clamped) < 0.001) {
      resolve();
      return;
    }
    const handler = () => {
      video.removeEventListener("seeked", handler);
      resolve();
    };
    video.addEventListener("seeked", handler);
    video.currentTime = clamped;
  });
}

export function captureFrame(video: HTMLVideoElement, format: string, quality: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("2D canvas context is not available."));
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't capture this frame."))), format, quality);
  });
}

/** Loads a file into an (offscreen) video element and resolves with its
 * metadata, applying the same seek-to-end-then-back workaround `useVideoFile`
 * uses for containers (e.g. MediaRecorder WebM) that don't report a duration
 * until the browser is forced to scan for one. */
export function loadVideoElement(video: HTMLVideoElement, url: string): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const handleError = () => {
      video.removeEventListener("error", handleError);
      reject(new Error("This video format isn't supported by your browser. Try MP4 (H.264) or WebM."));
    };

    const handleLoaded = () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("error", handleError);

      if (isFinite(video.duration)) {
        resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
        return;
      }

      const handleDurationChange = () => {
        if (!isFinite(video.duration)) return;
        video.removeEventListener("durationchange", handleDurationChange);
        const meta = { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
        video.currentTime = 0;
        resolve(meta);
      };
      video.addEventListener("durationchange", handleDurationChange);
      video.currentTime = 1e10;
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("error", handleError);
    video.src = url;
  });
}

export function formatTimestamp(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "00:00.0";
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}
