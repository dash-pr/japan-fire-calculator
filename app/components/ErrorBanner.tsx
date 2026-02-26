"use client";

import React, { useState } from "react";
import { ValidationError } from "@/lib/validation";

interface ErrorBannerProps {
  validationErrors: ValidationError[];
  simulationError: string | null;
}

export default function ErrorBanner({
  validationErrors,
  simulationError,
}: ErrorBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const hasErrors = validationErrors.length > 0 || simulationError !== null;

  if (!hasErrors) return null;

  const allErrors = [
    ...validationErrors.map((e) => ({ type: "validation", ...e })),
    ...(simulationError
      ? [{ type: "simulation", field: "simulation", message: simulationError }]
      : []),
  ];

  return (
    <div
      style={{
        marginBottom: 16,
        padding: "12px 16px",
        border: "2px solid #CC0000",
        background: "#FFF8F8",
        borderRadius: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 600,
              color: "#CC0000",
              letterSpacing: "0.05em",
            }}
          >
            {allErrors.length} ERROR{allErrors.length !== 1 ? "S" : ""}
          </span>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: "#CC0000",
          }}
        >
          {expanded ? "−" : "+"}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8D4D4" }}>
          {allErrors.map((err, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: idx < allErrors.length - 1 ? 8 : 0,
                paddingBottom: idx < allErrors.length - 1 ? 8 : 0,
                borderBottom:
                  idx < allErrors.length - 1
                    ? "1px solid #E8D4D4"
                    : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "#994444",
                  letterSpacing: "0.05em",
                  marginBottom: 2,
                }}
              >
                {err.field}
              </div>
              <div
                style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: 12,
                  color: "#CC0000",
                  lineHeight: 1.5,
                }}
              >
                {err.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
