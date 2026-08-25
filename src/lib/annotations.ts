export type AnnotationTool = "arrow" | "rectangle" | "circle" | "freehand" | "text";

interface BaseAnnotation {
  id: string;
  color: string;
  strokeWidth: number;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: "arrow" | "rectangle" | "circle";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: "freehand";
  points: { x: number; y: number }[];
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type Annotation = ShapeAnnotation | FreehandAnnotation | TextAnnotation;

let idCounter = 0;
export function nextAnnotationId(): string {
  idCounter += 1;
  return `annotation-${idCounter}`;
}

function drawArrow(ctx: CanvasRenderingContext2D, a: ShapeAnnotation) {
  const headLength = Math.max(10, a.strokeWidth * 4);
  const angle = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
  ctx.beginPath();
  ctx.moveTo(a.x1, a.y1);
  ctx.lineTo(a.x2, a.y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(a.x2, a.y2);
  ctx.lineTo(a.x2 - headLength * Math.cos(angle - Math.PI / 6), a.y2 - headLength * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(a.x2, a.y2);
  ctx.lineTo(a.x2 - headLength * Math.cos(angle + Math.PI / 6), a.y2 - headLength * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

export function drawAnnotation(ctx: CanvasRenderingContext2D, annotation: Annotation) {
  ctx.strokeStyle = annotation.color;
  ctx.fillStyle = annotation.color;
  ctx.lineWidth = annotation.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (annotation.type === "arrow") {
    drawArrow(ctx, annotation);
  } else if (annotation.type === "rectangle") {
    const x = Math.min(annotation.x1, annotation.x2);
    const y = Math.min(annotation.y1, annotation.y2);
    ctx.strokeRect(x, y, Math.abs(annotation.x2 - annotation.x1), Math.abs(annotation.y2 - annotation.y1));
  } else if (annotation.type === "circle") {
    const rx = Math.abs(annotation.x2 - annotation.x1) / 2;
    const ry = Math.abs(annotation.y2 - annotation.y1) / 2;
    const cx = (annotation.x1 + annotation.x2) / 2;
    const cy = (annotation.y1 + annotation.y2) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (annotation.type === "freehand") {
    if (annotation.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
    for (const point of annotation.points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
  } else if (annotation.type === "text") {
    ctx.font = `bold ${annotation.fontSize}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(annotation.text, annotation.x, annotation.y);
  }
}
