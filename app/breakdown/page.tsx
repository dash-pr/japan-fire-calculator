"use client";

import React from "react";
import YearlyTable from "@/app/components/YearlyTable";
import { useSimulator } from "@/app/context/SimulatorContext";

export default function BreakdownPage() {
  const { result, targetFireAge } = useSimulator();

  return (
    <>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--n500)",
          marginBottom: 10,
          borderBottom: "4px solid var(--ink)",
          paddingBottom: 6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <span>Year-by-Year Breakdown</span>
        <span style={{ fontSize: 9, letterSpacing: "0.12em" }}>
          December snapshot · accumulation → retirement → depletion
        </span>
      </div>

      <YearlyTable result={result} targetFireAge={targetFireAge} maxTableHeight="none" />
    </>
  );
}
