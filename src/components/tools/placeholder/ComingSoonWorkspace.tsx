import { Link } from "react-router-dom";
import type { ToolDefinition } from "../../../types/tool";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import styles from "./ComingSoonWorkspace.module.css";

export default function ComingSoonWorkspace({ tool }: { tool: ToolDefinition }) {
  return (
    <WorkspaceShell title={tool.name}>
      <div className={styles.notice}>
        <span className={styles.badge}>Coming soon</span>
        <p className={styles.description}>{tool.description}</p>
        <div className={styles.meta}>
          <span>
            <span className={styles.metaLabel}>Accepts</span>
            {tool.acceptedFileTypes.length > 0 ? tool.acceptedFileTypes.join(", ") : "N/A"}
          </span>
          <span>
            <span className={styles.metaLabel}>Outputs</span>
            {tool.outputTypes.join(", ")}
          </span>
        </div>
      </div>
      <p>
        This tool isn't built yet. It will use the same local import → process → preview → export
        pipeline as every other tool in the toolbox —{" "}
        <Link to="/diagnostics" className={styles.link}>
          preview that pipeline
        </Link>
        .
      </p>
    </WorkspaceShell>
  );
}
