import { formatTimestamp } from "../../../lib/video";
import styles from "./VideoTool.module.css";

interface VideoScrubberProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  step?: number;
}

export function VideoScrubber({ duration, currentTime, onSeek, step = 1 / 30 }: VideoScrubberProps) {
  return (
    <div className={styles.scrubberRow}>
      <button className={styles.stepButton} onClick={() => onSeek(Math.max(0, currentTime - step))} aria-label="Previous frame">
        −1f
      </button>
      <input
        className={styles.slider}
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Seek"
      />
      <button className={styles.stepButton} onClick={() => onSeek(Math.min(duration, currentTime + step))} aria-label="Next frame">
        +1f
      </button>
      <span className={`${styles.timestamp} mono`}>
        {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
      </span>
    </div>
  );
}
