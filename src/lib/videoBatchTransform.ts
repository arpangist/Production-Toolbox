import { computeCoverRect } from "./coverCrop";
import { pickWebmMimeType } from "./mediaRecorderSupport";

export interface VideoTransformConfig {
  targetWidth: number;
  targetHeight: number;
  cropToFit: boolean; // true = cover-crop to fill exactly; false = letterbox
}

/**
 * Re-encodes a whole video through a canvas at a fixed target size, either
 * cropping to fill (cover) or letterboxing to fit — the same real-time
 * canvas + MediaRecorder technique Trim uses, just for the full duration.
 */
export async function transformVideo(
  video: HTMLVideoElement,
  config: VideoTransformConfig,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  video.currentTime = 0;

  const canvas = document.createElement("canvas");
  canvas.width = config.targetWidth;
  canvas.height = config.targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available.");

  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream(canvasStream.getVideoTracks());

  const videoWithCapture = video as HTMLVideoElement & { captureStream?: () => MediaStream };
  if (typeof videoWithCapture.captureStream === "function") {
    try {
      const sourceStream = videoWithCapture.captureStream();
      for (const track of sourceStream.getAudioTracks()) combinedStream.addTrack(track);
    } catch {
      // Audio capture isn't available in every browser — continue video-only.
    }
  }

  const recorder = new MediaRecorder(combinedStream, { mimeType: pickWebmMimeType() });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const recordingDone = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();
  video.muted = false;
  await video.play();

  const duration = video.duration;
  let rafId = 0;
  await new Promise<void>((resolve) => {
    const draw = () => {
      if (video.ended || video.currentTime >= duration - 0.05) {
        resolve();
        return;
      }
      if (config.cropToFit) {
        const rect = computeCoverRect(video.videoWidth, video.videoHeight, config.targetWidth, config.targetHeight);
        ctx.drawImage(video, rect.x, rect.y, rect.width, rect.height, 0, 0, config.targetWidth, config.targetHeight);
      } else {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, config.targetWidth, config.targetHeight);
        const scale = Math.min(config.targetWidth / video.videoWidth, config.targetHeight / video.videoHeight);
        const drawW = video.videoWidth * scale;
        const drawH = video.videoHeight * scale;
        ctx.drawImage(video, (config.targetWidth - drawW) / 2, (config.targetHeight - drawH) / 2, drawW, drawH);
      }
      onProgress(Math.min(1, video.currentTime / duration));
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
  });

  cancelAnimationFrame(rafId);
  video.pause();
  video.muted = true;
  recorder.stop();
  for (const track of combinedStream.getTracks()) track.stop();
  await recordingDone;

  return new Blob(chunks, { type: recorder.mimeType });
}
