"use client";

import React from "react";
import Link from "next/link";
import FireSummary from "./components/FireSummary";
import { useSimulator } from "./context/SimulatorContext";
import { formatYen } from "@/lib/fireCalculator";

export default function Home() {
  const { result, targetFireAge, currentYear } = useSimulator();

  return (
    <>
      {/* Section label */}
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
        <span>Your FIRE Projection</span>
        <span style={{ fontSize: 9, letterSpacing: "0.12em" }}>
          Monthly simulation · Updates live as you adjust inputs
        </span>
      </div>

      {/* KPI Cards */}
      <FireSummary result={result} targetFireAge={targetFireAge} currentYear={currentYear} />

      <div className="ornament" style={{ marginTop: 20, marginBottom: 16 }}>&#x2727; &#x2727; &#x2727;</div>

      {/* Quick-stats row */}
      {result && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            border: "1px solid var(--ink)",
            marginBottom: 24,
          }}
        >
          {[
            {
              label: "Total iDeCo contributed",
              value: formatYen(result.totalIdecoContributed),
              desc: "Pre-tax contributions up to FIRE date",
            },
            {
              label: "Total NISA contributed",
              value: formatYen(result.totalNisaTsumitateContributed + result.totalNisaGrowthContributed),
              desc: "Tsumitate + growth slots combined",
            },
            {
              label: "Total taxable contributed",
              value: formatYen(result.totalTaxableContributed),
              desc: "After iDeCo & NISA are maxed",
            },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                padding: "16px 18px",
                borderRight: i < arr.length - 1 ? "1px solid var(--muted)" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--n500)",
                  marginBottom: 6,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--ink)",
                  lineHeight: 1,
                  marginBottom: 5,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "var(--n600)",
                  lineHeight: 1.4,
                }}
              >
                {stat.desc}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation cards to other sections */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          border: "1px solid var(--ink)",
        }}
      >
        {[
          {
            href: "/chart",
            label: "Portfolio Chart",
            tag: "Visualisation",
            desc: "Stacked area chart of iDeCo, NISA and taxable growth from today to age 95. FIRE crossover lines marked.",
          },
          {
            href: "/breakdown",
            label: "Data Table",
            tag: "Year-by-Year",
            desc: "Every year's portfolio balance, expenses, account split, and FIRE status in a scrollable table.",
          },
          {
            href: "/funds",
            label: "Fund Guide",
            tag: "NISA Funds",
            desc: "Compare popular Japanese index funds by expense ratio and expected return. Set fund return directly.",
          },
        ].map((card, i, arr) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              display: "block",
              padding: "20px 20px 18px",
              borderRight: i < arr.length - 1 ? "1px solid var(--ink)" : "none",
              textDecoration: "none",
              color: "inherit",
            }}
            className="hard-shadow-hover"
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 6,
              }}
            >
              {card.tag}
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 17,
                fontWeight: 700,
                color: "var(--ink)",
                marginBottom: 8,
                lineHeight: 1.2,
              }}
            >
              {card.label} →
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 12,
                fontStyle: "italic",
                color: "var(--n600)",
                lineHeight: 1.6,
              }}
            >
              {card.desc}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
