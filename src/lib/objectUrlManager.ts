// Tracks every object URL the app creates so it can be revoked on unmount
// or on demand, preventing the memory leaks large media files would cause.
class ObjectUrlManager {
  private urls = new Set<string>();

  create(source: Blob | MediaSource): string {
    const url = URL.createObjectURL(source);
    this.urls.add(url);
    return url;
  }

  revoke(url: string): void {
    if (!this.urls.has(url)) return;
    URL.revokeObjectURL(url);
    this.urls.delete(url);
  }

  revokeAll(): void {
    for (const url of this.urls) URL.revokeObjectURL(url);
    this.urls.clear();
  }

  get activeCount(): number {
    return this.urls.size;
  }
}

// One manager per browser tab is sufficient — tools share it and clean up
// their own URLs via the returned revoke function or on unmount.
export const objectUrlManager = new ObjectUrlManager();
