# Creative Production Toolbox

A browser-based suite of **50 creative utilities** for designers, video editors, and social media creators.

Everything runs **100% locally in your browser**. No uploads, no backend, no AI, no API keys, no accounts. Your files never leave your device.

## Why

Most online creative utilities require uploading your work to someone else's server. This toolbox does the same jobs entirely client-side using the Canvas, Web Worker, and MediaRecorder APIs — so unreleased campaign assets, client work, and unpublished footage stay on your machine.

## Tools

| Category | Tools |
| --- | --- |
| **Image** (7) | Resize, Crop, Compress, Format Converter, Palette Extractor, Metadata Viewer, Difference Viewer |
| **Video** (6) | Trim, Frame Extractor, Contact Sheet, Safe Zone, Cut Detection, Shot Analyzer |
| **Design** (10) | Gradient Generator, Duotone, Grain / Noise, Border & Frame, Long Shadow, Halftone, Glitch Effects, Perspective Grid, Layout Grid, Typography Scale |
| **Social** (4) | Format Resize, Carousel Splitter, Thumbnail Preview, Profile Grid Preview |
| **Brand** (5) | Brand Color Manager, Typography Board, Token Generator, Brand Validator, Logo Safe Area |
| **Creative QA** (2) | Export Preflight, Creative Version Comparator |
| **Asset Management** (5) | Batch Renamer, Asset Dimension Scanner, Asset Contact Sheet, Duplicate Finder, SVG Optimizer |
| **Production** (6) | Batch Image Processor, Batch Video Processor, Image Sequence Builder, File Size Calculator, Export Presets, ZIP Asset Builder |
| **Review** (5) | Before / After, Creative Rating Board, Annotation Board, Presentation Builder, Approval Tracker |

## Getting started

```bash
npm install
```

```bash
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

### Other commands

```bash
npm run build
```

```bash
npm run lint
```

```bash
npm run preview
```

## Architecture

- **Vite + React 19 + TypeScript** (strict mode)
- **Lazy-loaded tool registry** — each tool is a separate code-split chunk, so opening one tool never downloads the other 49
- **Web Workers** — image processing runs off the main thread via a shared worker pool with progress reporting and cancellation
- **Canvas / OffscreenCanvas** for all image work; **HTMLVideoElement + MediaRecorder** for video re-encoding
- **IndexedDB** stores only lightweight preferences (recent tools, favorites, brand profile, export presets) in a single shared object store — media is never persisted
- **Keyboard-first** — `Ctrl/Cmd + K` opens the command palette from anywhere

## Design system

Design tokens live as CSS custom properties in [`src/index.css`](src/index.css) and cascade to every component via CSS Modules.

| Token | Value |
| --- | --- |
| Primary | `#8E3BF2` |
| Shade | `#3E1770` |
| Surface / background | `#FBF7FF` |
| Warm accent | `#FF7A45` |

Icons are hand-built SVGs in [`src/components/icons/`](src/components/icons) — no icon-font or emoji dependencies. All text meets WCAG AA contrast (4.5:1), every interactive element has a visible focus state, and the layout is verified at 375 / 768 / 1024 / 1440px.

## Browser support

Requires a modern browser with Web Worker, Canvas, and MediaRecorder support — current Chrome, Edge, Firefox, or Safari. Video export uses WebM via MediaRecorder.

## License

MIT
