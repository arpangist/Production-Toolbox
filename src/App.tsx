import { Suspense, lazy } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { RecentFavoritesProvider } from "./hooks/RecentFavoritesContext";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ToolRoute } from "./components/workspace/ToolRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { WorkspaceLoading } from "./components/workspace/WorkspaceLoading";

const Diagnostics = lazy(() =>
  import("./components/diagnostics/Diagnostics").then((m) => ({ default: m.Diagnostics })),
);

export default function App() {
  return (
    <RecentFavoritesProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="tool/:toolId" element={<ToolRoute />} />
            <Route
              path="diagnostics"
              element={
                <ErrorBoundary toolName="System Check">
                  <Suspense fallback={<WorkspaceLoading />}>
                    <Diagnostics />
                  </Suspense>
                </ErrorBoundary>
              }
            />
          </Route>
        </Routes>
      </HashRouter>
    </RecentFavoritesProvider>
  );
}
