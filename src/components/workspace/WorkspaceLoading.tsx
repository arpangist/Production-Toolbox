import styles from "./WorkspaceLoading.module.css";

export function WorkspaceLoading() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>Loading tool…</span>
    </div>
  );
}
