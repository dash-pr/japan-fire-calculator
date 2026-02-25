"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSimulator } from "@/app/context/SimulatorContext";
import InputPanel from "./InputPanel";

// ── Nav sections ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/",           label: "Dashboard",      short: "Front Page" },
  { href: "/chart",      label: "Portfolio Chart", short: "Chart"      },
  { href: "/breakdown",  label: "Data Table",      short: "Breakdown"  },
  { href: "/cashflow",   label: "Cash Flow",       short: "Cash Flow"  },
  { href: "/funds",      label: "Fund Guide",      short: "Funds"      },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    currentAge,
    setCurrentAge,
    targetFireAge,
    setTargetFireAge,
    monthlyIncome,
    setMonthlyIncome,
    monthlyExpenses,
    setMonthlyExpenses,
    postFireMonthlyExpenses,
    setPostFireMonthlyExpenses,
    salaryIncreaseRate,
    setSalaryIncreaseRate,
    annualInflation,
    setAnnualInflation,
    accounts,
    setAccounts,
    idecoType,
    setIdecoType,
    annualReturn,
    setAnnualReturn,
    futureExpenses,
    setFutureExpenses,
    juniorNisaBalance,
    setJuniorNisaBalance,
    swpDepletionAge,
    setSwpDepletionAge,
    postFireMonthlyIncome,
    setPostFireMonthlyIncome,
    lifestyleInflation,
    setLifestyleInflation,
    postFatfireMonthlyIncome,
    setPostFatfireMonthlyIncome,
  } = useSimulator();

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--paper)",
      }}
    >
      {/* ── MASTHEAD ─────────────────────────────────────────────────────── */}
      <header style={{ borderTop: "5px solid var(--ink)", borderBottom: "1px solid var(--ink)", flexShrink: 0 }}>
        {/* Edition line */}
        <div
          style={{
            borderBottom: "1px solid var(--ink)",
            padding: "4px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--n600)",
            }}
          >
            Vol. 1 &nbsp;·&nbsp; {today} &nbsp;·&nbsp; Tokyo Edition
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--n600)",
            }}
          >
              iDeCo &nbsp;·&nbsp; NISA &nbsp;·&nbsp; SWP to 90
          </span>
        </div>

        {/* Nameplate row */}
        <div
          style={{
            padding: "16px 24px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ minWidth: 180, textAlign: "left" }}>
            <p
              style={{
                margin: 0,
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 11,
                fontStyle: "italic",
                color: "var(--n600)",
                lineHeight: 1.5,
                maxWidth: 180,
              }}
            >
              Your personal path to<br />financial independence in Japan
            </p>
          </div>

          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', 'Times New Roman', serif",
              fontSize: "clamp(28px, 5vw, 56px)",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textAlign: "center",
              color: "var(--ink)",
              flex: 1,
            }}
          >
            The Japan<br />FIRE Gazette
          </h1>

          <div style={{ minWidth: 180, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div
              style={{
                background: "var(--accent)",
                color: "#F9F9F7",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                padding: "3px 9px",
                textTransform: "uppercase",
              }}
            >
              ■ Live
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "var(--n500)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textAlign: "right",
              }}
            >
              Age {currentAge} → 90 projection
            </span>
          </div>
        </div>
      </header>

      {/* ── SECTION NAV ──────────────────────────────────────────────────── */}
      <nav
        style={{
          borderBottom: "3px solid var(--ink)",
          display: "flex",
          flexShrink: 0,
          background: "var(--paper)",
        }}
      >
        {NAV_ITEMS.map((item, i) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 20px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                textDecoration: "none",
                color: active ? "var(--paper)" : "var(--n500)",
                background: active ? "var(--ink)" : "transparent",
                borderRight: i < NAV_ITEMS.length - 1 ? "1px solid var(--muted)" : "none",
                transition: "all 0.12s",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Link>
          );
        })}
        {/* Right filler */}
        <div style={{ flex: 1, borderLeft: "none" }} />
      </nav>

      {/* ── BODY ROW: sidebar + content ───────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>

        {/* ── BLACK SIDEBAR ── */}
        <aside
          className="sidebar-section newsprint-texture"
          style={{
            width: 292,
            minWidth: 260,
            maxWidth: 292,
            flexShrink: 0,
            background: "#111111",
            borderRight: "1px solid #111111",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sidebar header */}
          <div
            style={{
              padding: "20px 18px 0",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              paddingBottom: 12,
              marginBottom: 0,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 4,
              }}
            >
              Inputs & Assumptions
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                color: "#F9F9F7",
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              Your Numbers
            </div>
          </div>

          <div style={{ padding: "0 18px 24px", flex: 1 }}>
            <InputPanel
              currentAge={currentAge}
              targetFireAge={targetFireAge}
              onCurrentAge={setCurrentAge}
              onTargetFireAge={setTargetFireAge}
              monthlyIncome={monthlyIncome}
              monthlyExpenses={monthlyExpenses}
              postFireMonthlyExpenses={postFireMonthlyExpenses}
              salaryIncreaseRate={salaryIncreaseRate}
              annualInflation={annualInflation}
              onMonthlyIncome={setMonthlyIncome}
              onMonthlyExpenses={setMonthlyExpenses}
              onPostFireMonthlyExpenses={setPostFireMonthlyExpenses}
              onSalaryIncreaseRate={setSalaryIncreaseRate}
              onAnnualInflation={setAnnualInflation}
              accounts={accounts}
              onAccounts={setAccounts}
              idecoType={idecoType}
              onIdecoType={setIdecoType}
              juniorNisaBalance={juniorNisaBalance}
              onJuniorNisaBalance={setJuniorNisaBalance}
              annualReturn={annualReturn}
              onAnnualReturn={setAnnualReturn}
              swpDepletionAge={swpDepletionAge}
              onSwpDepletionAge={setSwpDepletionAge}
              postFireMonthlyIncome={postFireMonthlyIncome}
              onPostFireMonthlyIncome={setPostFireMonthlyIncome}
              lifestyleInflation={lifestyleInflation}
              onLifestyleInflation={setLifestyleInflation}
              postFatfireMonthlyIncome={postFatfireMonthlyIncome}
              onPostFatfireMonthlyIncome={setPostFatfireMonthlyIncome}
              futureExpenses={futureExpenses}
              onFutureExpenses={setFutureExpenses}
            />
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            padding: "24px 28px 40px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}

          {/* Footer */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 32,
              borderTop: "1px solid var(--ink)",
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              marginBottom: 0,
            }}
          >
            <div style={{ flex: "0 0 auto" }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--n500)",
                }}
              >
                Disclaimer
              </span>
            </div>
            <p
              style={{
                flex: 1,
                margin: 0,
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 11,
                fontStyle: "italic",
                color: "var(--n600)",
                lineHeight: 1.7,
              }}
            >
              iDeCo capped at ¥68,000/mo (freelancer) or ¥23,000/mo (employee). New NISA 2024: tsumitate ¥1.2M/yr (¥6M lifetime) + growth ¥2.4M/yr (¥12M lifetime).
              Capital gains tax 20.315% on taxable gains. Income tax benefit on iDeCo contributions ~20%.
              SWP (Systematic Withdrawal Plan) draws portfolio to ¥0 by age 90. Drawdown order: taxable → NISA growth → NISA tsumitate → iDeCo (from age 60).
              <strong style={{ fontStyle: "normal" }}> Results are illustrative, not financial advice.</strong>
            </p>
            <div style={{ flex: "0 0 auto", alignSelf: "flex-end" }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: "var(--n500)",
                  letterSpacing: "0.1em",
                }}
              >
                Ed. Vol 1.0 · Tokyo
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
