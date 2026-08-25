import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  toolName?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" style={{ padding: "var(--space-6)", maxWidth: 480, margin: "0 auto" }}>
        <h2 style={{ fontSize: 16, marginBottom: "var(--space-2)" }}>
          {this.props.toolName ? `${this.props.toolName} hit a problem` : "Something went wrong"}
        </h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
          This didn't process correctly. Your files never left your device, so nothing was lost — try again,
          or use a different file.
        </p>
        <button
          onClick={this.reset}
          style={{
            padding: "var(--space-2) var(--space-4)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-surface)",
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
