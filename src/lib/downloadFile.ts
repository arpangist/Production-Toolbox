export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Deferred so the browser has time to start the download before the
  // backing URL is revoked.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
