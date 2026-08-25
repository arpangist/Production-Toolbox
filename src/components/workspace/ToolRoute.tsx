import { Suspense, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getToolById } from "../../registry/tools";
import { toolComponents } from "../../registry/toolComponents";
import { useRecentFavoritesContext } from "../../hooks/useRecentFavoritesContext";
import { ErrorBoundary } from "../ErrorBoundary";
import { WorkspaceLoading } from "./WorkspaceLoading";

export function ToolRoute() {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = toolId ? getToolById(toolId) : undefined;
  const { recordVisit } = useRecentFavoritesContext();

  useEffect(() => {
    if (tool) recordVisit(tool.id);
  }, [tool, recordVisit]);

  // Every tool's module is lazy-loaded on demand — opening one tool never
  // downloads another category's processing code.
  const LazyTool = tool ? toolComponents.get(tool.id) : undefined;

  if (!tool || !LazyTool) return <Navigate to="/" replace />;

  return (
    <ErrorBoundary toolName={tool.name}>
      <Suspense fallback={<WorkspaceLoading />}>
        {/* LazyTool is looked up from a module-level Map built once in
            toolComponents.ts, not created here — safe to render directly. */}
        {/* oxlint-disable-next-line react/static-components */}
        <LazyTool tool={tool} />
      </Suspense>
    </ErrorBoundary>
  );
}
