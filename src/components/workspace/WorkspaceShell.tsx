import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "../icons/uiIcons";
import styles from "./WorkspaceShell.module.css";

interface WorkspaceShellProps {
  title: string;
  children: ReactNode;
}

export function WorkspaceShell({ title, children }: WorkspaceShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/" className={styles.back}>
          <ArrowLeftIcon size={15} aria-hidden="true" />
          Back
        </Link>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
