type FlashcardErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type FlashcardEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: FlashcardErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __flashcardEvents?: FlashcardEvents;
  }
}

export function reportFlashcardError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__flashcardEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
}
