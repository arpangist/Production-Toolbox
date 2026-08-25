import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { downloadBlob } from "../../../lib/downloadFile";
import { drawAnnotation, nextAnnotationId, type Annotation, type AnnotationTool } from "../../../lib/annotations";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { ImageToolLayout } from "../image/ImageToolLayout";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import styles from "./AnnotationBoardWorkspace.module.css";

const TOOLS: { key: AnnotationTool; label: string }[] = [
  { key: "arrow", label: "Arrow" },
  { key: "rectangle", label: "Rectangle" },
  { key: "circle", label: "Circle" },
  { key: "freehand", label: "Freehand" },
  { key: "text", label: "Text" },
];

export default function AnnotationBoardWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const url = useObjectUrl(file);

  const [activeTool, setActiveTool] = useState<AnnotationTool>("arrow");
  const [color, setColor] = useState("#ff3b30");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(28);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pendingText, setPendingText] = useState<{ x: number; y: number } | null>(null);
  const [textDraft, setTextDraft] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const draftRef = useRef<Annotation | null>(null);
  const drawingRef = useRef(false);

  const redraw = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !img || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const a of annotations) drawAnnotation(ctx, a);
    if (draftRef.current) drawAnnotation(ctx, draftRef.current);
  };

  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      redraw();
    };
    img.src = url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations]);

  const toCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!imageRef.current) return;
    const point = toCanvasPoint(event);

    if (activeTool === "text") {
      setPendingText(point);
      setTextDraft("");
      return;
    }

    drawingRef.current = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);

    if (activeTool === "freehand") {
      draftRef.current = { id: nextAnnotationId(), type: "freehand", color, strokeWidth, points: [point] };
    } else {
      draftRef.current = { id: nextAnnotationId(), type: activeTool, color, strokeWidth, x1: point.x, y1: point.y, x2: point.x, y2: point.y };
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !draftRef.current) return;
    const point = toCanvasPoint(event);
    if (draftRef.current.type === "freehand") {
      draftRef.current.points.push(point);
    } else if (draftRef.current.type !== "text") {
      draftRef.current.x2 = point.x;
      draftRef.current.y2 = point.y;
    }
    redraw();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current || !draftRef.current) return;
    drawingRef.current = false;
    const finished = draftRef.current;
    draftRef.current = null;
    setAnnotations((prev) => [...prev, finished]);
  };

  const commitText = () => {
    if (pendingText && textDraft.trim()) {
      setAnnotations((prev) => [
        ...prev,
        { id: nextAnnotationId(), type: "text", color, strokeWidth, x: pendingText.x, y: pendingText.y, text: textDraft, fontSize },
      ]);
    }
    setPendingText(null);
    setTextDraft("");
  };

  const undo = () => setAnnotations((prev) => prev.slice(0, -1));
  const clearAll = () => setAnnotations([]);

  const handleDownload = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, "annotated.png");
    }, "image/png");
  };

  const handleChangeFile = () => {
    reset();
    setAnnotations([]);
    imageRef.current = null;
  };

  return (
    <WorkspaceShell title={tool.name}>
      <ImageToolLayout
        file={file}
        error={error}
        onFiles={importFiles}
        onChangeFile={handleChangeFile}
        settings={
          <>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Tool</span>
              <div className={imageStyles.chipRow}>
                {TOOLS.map((option) => (
                  <button key={option.key} className={imageStyles.chip} data-active={activeTool === option.key} onClick={() => setActiveTool(option.key)}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Color</span>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Stroke width — {strokeWidth}px</span>
              <input className={imageStyles.slider} type="range" min={1} max={20} value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} />
            </div>

            {activeTool === "text" && (
              <div className={imageStyles.field}>
                <span className={imageStyles.fieldLabel}>Font size — {fontSize}px</span>
                <input className={imageStyles.slider} type="range" min={12} max={72} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
              </div>
            )}

            <div className={imageStyles.row}>
              <button className={imageStyles.chip} onClick={undo} disabled={annotations.length === 0}>
                Undo
              </button>
              <button className={imageStyles.chip} onClick={clearAll} disabled={annotations.length === 0}>
                Clear all
              </button>
            </div>
          </>
        }
        preview={
          <div className={styles.stageWrap}>
            <div className={styles.stage}>
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
              {pendingText && (
                <input
                  autoFocus
                  className={styles.textInput}
                  style={{ left: pendingText.x, top: pendingText.y }}
                  value={textDraft}
                  onChange={(e) => setTextDraft(e.target.value)}
                  onBlur={commitText}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitText();
                    if (e.key === "Escape") setPendingText(null);
                  }}
                />
              )}
            </div>
          </div>
        }
        footer={
          <div className={imageStyles.footer}>
            <span className={imageStyles.statusRow}>
              {annotations.length} annotation{annotations.length === 1 ? "" : "s"}
            </span>
            <button className={imageStyles.downloadButton} onClick={handleDownload}>
              Download PNG
            </button>
          </div>
        }
      />
    </WorkspaceShell>
  );
}
