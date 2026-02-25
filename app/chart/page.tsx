"use client";

import React from "react";
import PortfolioChart from "@/app/components/PortfolioChart";
import { useSimulator } from "@/app/context/SimulatorContext";

export default function ChartPage() {
  const { result } = useSimulator();

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
        <span>Portfolio Chart</span>
        <span style={{ fontSize: 9, letterSpacing: "0.12em" }}>
          iDeCo · NISA · Taxable · FIRE threshold
        </span>
      </div>

      <PortfolioChart result={result} />
    </>
  );
}
