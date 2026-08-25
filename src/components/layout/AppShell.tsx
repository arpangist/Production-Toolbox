import { useCallback, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useGlobalHotkey } from "../../hooks/useGlobalHotkey";
import { CommandPalette } from "./CommandPalette";
import { SearchIcon, SparkleIcon } from "../icons/uiIcons";
import styles from "./AppShell.module.css";

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useGlobalHotkey("k", (event) => {
    event.preventDefault();
    openPalette();
  }, { meta: true });

  return (
    <div className={styles.shell}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            <SparkleIcon size={16} />
          </span>
          Creative Toolbox
        </Link>
        <button className={styles.searchTrigger} onClick={openPalette} aria-label="Search tools">
          <SearchIcon size={16} aria-hidden="true" />
          <span className={styles.searchLabel}>Search tools</span>
          <span className={styles.kbd}>Ctrl K</span>
        </button>
      </header>
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
      <p className={styles.privacyNote}>Local processing — your files stay on your device.</p>
      {paletteOpen && <CommandPalette onClose={closePalette} />}
    </div>
  );
}
