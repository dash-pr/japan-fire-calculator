"use client";

import React, { useMemo } from "react";
import { NISA_FUNDS, NisaFund, runSimulation } from "@/lib/fireCalculator";
import { useSimulator } from "@/app/context/SimulatorContext";

export default function FundsPage() {
  const {
    currentAge,
    targetFireAge,
    monthlyIncome,
    monthlyExpenses,
    salaryIncreaseRate,
    annualInflation,
    accounts,
    idecoType,
    futureExpenses,
    annualReturn,
    setAnnualReturn,
  } = useSimulator();

  // Run a quick simulation for each fund to compare projected FIRE ages
  const fundProjections = useMemo(() => {
    return NISA_FUNDS.map((fund) => {
      try {
        const res = runSimulation({
          currentAge,
          targetFireAge,
          currentMonthlyIncome: monthlyIncome,
          monthlyExpenses,
          postFireMonthlyExpenses: monthlyExpenses,   // use same as working for fund comparison
          salaryIncreaseRate,
          annualInflation,
          accounts,
          idecoType,
          futureExpenses,
          juniorNisaBalance: 0,
          annualReturn: fund.expectedReturn,
        });
        return {
          fund,
          leanFireAge: res.leanFireAge,
          leanFireYear: res.leanFireYear,
          fatFireAge: res.fatFireAge,
          finalPortfolio: res.finalPortfolio,
        };
      } catch {
        return { fund, leanFireAge: undefined, leanFireYear: undefined, fatFireAge: undefined, finalPortfolio: 0 };
      }
    });
  }, [currentAge, targetFireAge, monthlyIncome, monthlyExpenses, salaryIncreaseRate, annualInflation, accounts, idecoType, futureExpenses]);

  return (
    <>
      {/* Page header */}
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
        <span>NISA Fund Guide</span>
        <span style={{ fontSize: 9, letterSpacing: "0.12em" }}>
          Click a fund to apply its return rate to your simulation
        </span>
      </div>

      {/* Active return banner */}
      <div
        style={{
          border: "1px solid var(--ink)",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          background: "var(--n100)",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--n600)",
          }}
        >
          Currently using
        </span>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink)",
          }}
        >
          {annualReturn}% annual return
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: "var(--n500)",
          }}
        >
          {NISA_FUNDS.find((f) => f.expectedReturn === annualReturn)?.name ?? "Custom rate"}
        </span>
      </div>

      {/* Fund grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 0,
          border: "1px solid var(--ink)",
        }}
      >
        {fundProjections.map(({ fund, leanFireAge, leanFireYear, fatFireAge, finalPortfolio }, idx) => {
          const isActive = annualReturn === fund.expectedReturn;
          const colCount = 2; // approximate; used for border logic
          return (
            <FundCard
              key={fund.ticker}
              fund={fund}
              leanFireAge={leanFireAge}
              leanFireYear={leanFireYear}
              fatFireAge={fatFireAge}
              finalPortfolio={finalPortfolio}
              isActive={isActive}
              onSelect={() => setAnnualReturn(fund.expectedReturn)}
              borderRight={(idx % colCount) === 0}
              borderBottom
            />
          );
        })}
      </div>

      {/* Methodology note */}
      <div
        style={{
          marginTop: 20,
          padding: "14px 18px",
          border: "1px solid var(--muted)",
          background: "var(--n100)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 11,
            fontStyle: "italic",
            color: "var(--n600)",
            lineHeight: 1.7,
          }}
        >
          FIRE ages shown above use each fund's <strong style={{ fontStyle: "normal" }}>gross expected return before expense ratio</strong>.
          The simulation applies the fund's stated expected return directly; expense ratios are shown for comparison but
          not separately deducted (they are already factored into historical return estimates for most funds).
          Past returns do not guarantee future performance.
        </p>
      </div>
    </>
  );
}

// ── Fund Card ─────────────────────────────────────────────────────────────────
function FundCard({
  fund,
  leanFireAge,
  leanFireYear,
  fatFireAge,
  finalPortfolio,
  isActive,
  onSelect,
  borderRight,
  borderBottom,
}: {
  fund: NisaFund;
  leanFireAge?: number;
  leanFireYear?: number;
  fatFireAge?: number;
  finalPortfolio: number;
  isActive: boolean;
  onSelect: () => void;
  borderRight: boolean;
  borderBottom: boolean;
}) {
  const portfolioStr =
    finalPortfolio >= 1_0000_0000
      ? `¥${(finalPortfolio / 1_0000_0000).toFixed(1)}億`
      : `¥${(finalPortfolio / 1_0000).toFixed(0)}万`;

  return (
    <button
      onClick={onSelect}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "20px 20px 18px",
        background: isActive ? "#FFF8F8" : "var(--paper)",
        border: "none",
        borderTop: isActive ? "3px solid var(--accent)" : "3px solid transparent",
        borderRight: borderRight ? "1px solid var(--ink)" : "none",
        borderBottom: "1px solid var(--muted)",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
      className="hard-shadow-hover"
    >
      {/* Category + active badge row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: isActive ? "var(--accent)" : "var(--n500)",
          }}
        >
          {fund.category}
        </span>
        {isActive && (
          <span
            style={{
              background: "var(--accent)",
              color: "#F9F9F7",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "2px 7px",
            }}
          >
            ■ Active
          </span>
        )}
      </div>

      {/* Fund name */}
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 14,
          fontWeight: 700,
          color: "var(--ink)",
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        {fund.name}
      </div>

      {/* Benchmark */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "var(--n500)",
          marginBottom: 14,
        }}
      >
        {fund.benchmark}
      </div>

      {/* Metrics row */}
      <div style={{ display: "flex", gap: 0, borderTop: "1px solid var(--muted)", paddingTop: 12, marginTop: 4 }}>
        <Metric label="Exp. Return" value={`${fund.expectedReturn}%`} accent={isActive} />
        <Metric label="Expense Ratio" value={`${fund.expenseRatio}%`} />
        <Metric label="Lean FIRE" value={leanFireAge ? `Age ${leanFireAge}` : "—"} />
        <Metric label="Fat FIRE" value={fatFireAge ? `Age ${fatFireAge}` : "—"} />
        <Metric label="Age-95 Portfolio" value={portfolioStr} last />
      </div>
    </button>
  );
}

function Metric({
  label,
  value,
  accent = false,
  last = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        paddingRight: last ? 0 : 12,
        borderRight: last ? "none" : "1px solid var(--muted)",
        marginRight: last ? 0 : 12,
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--n500)",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 14,
          fontWeight: 700,
          color: accent ? "var(--accent)" : "var(--ink)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
