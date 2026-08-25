export interface Slide {
  file: File;
  caption: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read this file."));
    reader.readAsDataURL(file);
  });
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

/** A single self-contained HTML file — images inlined as data URLs, no
 * external requests, opens and runs the slideshow offline. */
export async function buildPresentationHtml(slides: Slide[]): Promise<string> {
  const dataUrls = await Promise.all(slides.map((s) => fileToDataUrl(s.file)));
  const slidesHtml = slides
    .map(
      (slide, i) => `<div class="slide" data-index="${i}" style="display:${i === 0 ? "flex" : "none"}">
  <img src="${dataUrls[i]}" alt="Slide ${i + 1}" />
  ${slide.caption ? `<p class="caption">${escapeHtml(slide.caption)}</p>` : ""}
</div>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Presentation</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #111111; color: #f7f7f5; font-family: -apple-system, sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; }
  #slides { position: relative; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
  .slide { flex-direction: column; align-items: center; justify-content: center; gap: 16px; width: 100%; height: 100%; padding: 40px; }
  .slide img { max-width: 100%; max-height: 80vh; object-fit: contain; }
  .caption { font-size: 16px; color: #cfcfcc; text-align: center; max-width: 700px; }
  .nav { position: fixed; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.1); border: none; color: #fff; font-size: 28px; width: 48px; height: 48px; border-radius: 999px; cursor: pointer; }
  #prev { left: 16px; }
  #next { right: 16px; }
  #counter { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); font-size: 13px; color: #6b6b6b; }
</style>
</head>
<body>
  <div id="slides">${slidesHtml}</div>
  <button id="prev" class="nav" aria-label="Previous">‹</button>
  <button id="next" class="nav" aria-label="Next">›</button>
  <div id="counter"></div>
  <script>
    var slides = document.querySelectorAll('.slide');
    var i = 0;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, idx) { s.style.display = idx === i ? 'flex' : 'none'; });
      document.getElementById('counter').textContent = (i + 1) + ' / ' + slides.length;
    }
    document.getElementById('prev').onclick = function () { show(i - 1); };
    document.getElementById('next').onclick = function () { show(i + 1); };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'ArrowLeft') show(i - 1);
    });
    show(0);
  </script>
</body>
</html>`;
}

/** Composites each slide's caption onto its image for a standalone,
 * presentation-ready frame — used for the image-sequence export path. */
export async function renderSlideWithCaption(slide: Slide): Promise<Blob> {
  const url = URL.createObjectURL(slide.file);
  const img = new Image();
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);

  const captionHeight = slide.caption ? 64 : 0;
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight + captionHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available.");

  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  if (slide.caption) {
    ctx.fillStyle = "#f7f7f5";
    ctx.font = "20px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(slide.caption, 20, img.naturalHeight + captionHeight / 2, canvas.width - 40);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't render this slide."))), "image/png");
  });
}
