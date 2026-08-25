import { seekTo } from "./video";
import { pickWebmMimeType } from "./mediaRecorderSupport";

export interface TrimProgress {
  currentTime: number;
  inPoint: number;
  outPoint: number;
}

/**
 * Re-encodes the [inPoint, outPoint] range of a video by playing it in real
 * time while a canvas mirrors each frame, recording the canvas (plus the
 * original audio track, if any) with MediaRecorder. There is no muxing
 * library involved, so this only runs as fast as real playback.
 */
export async function trimVideo(
  video: HTMLVideoElement,
  inPoint: number,
  outPoint: number,
  onProgress: (progress: TrimProgress) => void,
): Promise<Blob> {
  await seekTo(video, inPoint);

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
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
      // Audio capture isn't available in every browser — silently continue
      // with a video-only export rather than failing the whole trim.
    }
  }

  const mimeType = pickWebmMimeType();
  const recorder = new MediaRecorder(combinedStream, { mimeType });
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

  let rafId = 0;
  await new Promise<void>((resolve) => {
    const draw = () => {
      if (video.currentTime >= outPoint || video.ended) {
        resolve();
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      onProgress({ currentTime: video.currentTime, inPoint, outPoint });
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
  return new Blob(chunks, { type: mimeType });
}
