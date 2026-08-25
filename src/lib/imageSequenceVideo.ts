import { pickWebmMimeType } from "./mediaRecorderSupport";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't load one of the frames."));
    };
    img.src = url;
  });
}

/** Builds a WebM video from a sequence of still images by drawing each one
 * to a canvas and holding it for `1/fps` seconds while a MediaRecorder
 * captures the canvas stream — real-time, since there's no muxing library. */
export async function buildSequenceVideo(files: File[], fps: number, onProgress: (progress: number) => void): Promise<Blob> {
  const images = await Promise.all(files.map(loadImage));
  const width = Math.max(...images.map((i) => i.naturalWidth));
  const height = Math.max(...images.map((i) => i.naturalHeight));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available.");

  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
  const recorder = new MediaRecorder(stream, { mimeType: pickWebmMimeType() });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const recordingDone = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start(100);
  const frameDurationMs = 1000 / fps;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(img, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
    track.requestFrame?.();
    onProgress((i + 1) / images.length);
    await new Promise((resolve) => setTimeout(resolve, frameDurationMs));
  }

  recorder.stop();
  for (const t of stream.getTracks()) t.stop();
  await recordingDone;

  return new Blob(chunks, { type: recorder.mimeType });
}
