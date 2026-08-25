import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tools } from "../../registry/tools";
import { searchTools } from "../../lib/search";
import { CATEGORY_LABELS } from "../../types/tool";
import { CATEGORY_ICONS } from "../icons/categoryIcons";
import { SearchIcon } from "../icons/uiIcons";
import styles from "./CommandPalette.module.css";

interface CommandPaletteProps {
  onClose: () => void;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [queryAtLastReset, setQueryAtLastReset] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => searchTools(tools, query).map((r) => r.tool), [query]);

  // Reset the highlighted result whenever the query changes, without an
  // effect — this is state derived during render, not a side effect.
  if (query !== queryAtLastReset) {
    setQueryAtLastReset(query);
    setActiveIndex(0);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const select = (id: string) => {
    navigate(`/tool/${id}`);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) select(target.id);
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.inputRow}>
          <SearchIcon size={17} className={styles.inputIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search tools…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search tools"
            aria-activedescendant={results[activeIndex] ? `result-${results[activeIndex].id}` : undefined}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-results"
          />
          <span className={styles.escHint}>Esc</span>
        </div>
        <div className={styles.results} id="command-palette-results" role="listbox">
          {results.length === 0 && <p className={styles.empty}>No tools match "{query}".</p>}
          {results.map((tool, index) => {
            const CategoryIcon = CATEGORY_ICONS[tool.category];
            return (
              <button
                key={tool.id}
                id={`result-${tool.id}`}
                role="option"
                aria-selected={index === activeIndex}
                className={styles.result}
                data-active={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(tool.id)}
              >
                <span className={styles.resultIcon} aria-hidden="true">
                  <CategoryIcon size={16} />
                </span>
                <span className={styles.resultText}>
                  <span className={styles.resultName}>{tool.name}</span>
                  <span className={styles.resultMeta}>
                    {CATEGORY_LABELS[tool.category]}
                    {tool.status === "coming-soon" ? " · Coming soon" : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
