import { useEffect, useRef, useState } from "react";
import { useObjectUrl } from "./useObjectUrl";
import type { VideoMeta } from "../lib/video";

export function useVideoFile(file: File | null) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const url = useObjectUrl(file);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Reset per-file state when the source URL changes, without an effect —
  // this is state derived from a prop change, adjusted during render.
  const [resetForUrl, setResetForUrl] = useState(url);
  if (url !== resetForUrl) {
    setResetForUrl(url);
    setMeta(null);
    setError(null);
    setCurrentTime(0);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    const handleLoaded = () => {
      if (isFinite(video.duration)) {
        setMeta({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
        return;
      }

      // Some containers (notably WebM straight out of MediaRecorder) don't
      // report a duration until the browser is forced to scan for one —
      // seeking near the end and back is the standard workaround.
      const handleDurationChange = () => {
        if (!isFinite(video.duration)) return;
        video.removeEventListener("durationchange", handleDurationChange);
        setMeta({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
        video.currentTime = 0;
      };
      video.addEventListener("durationchange", handleDurationChange);
      video.currentTime = 1e10;
    };
    const handleError = () => {
      setError("This video format isn't supported by your browser. Try MP4 (H.264) or WebM.");
    };
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("error", handleError);
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [url]);

  return { videoRef, url, meta, error, currentTime, setCurrentTime };
}
