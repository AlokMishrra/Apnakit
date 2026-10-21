"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              ApnaKit could not load
            </h1>
            <p style={{ color: "#666", marginBottom: 16 }}>
              Please refresh the page. If this keeps happening, try again in a moment.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#5b0a0a",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
