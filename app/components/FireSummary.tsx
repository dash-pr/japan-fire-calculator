"use client";

import React from "react";
import { SimulationResult } from "@/lib/fireCalculator";
import { formatYen } from "@/lib/fireCalculator";

interface Props {
    result: SimulationResult | null;
    targetFireAge: number;
    currentYear: number;
}

function StatCard({
    label,
    value,
    sub,
    isLast = false,
    highlight = false,
}: {
    label: string;
    value: string;
    sub?: string;
    isLast?: boolean;
    highlight?: boolean;
}) {
    return (
        <div
            className="hard-shadow-hover fire-stat-card"
            style={{
                padding: "18px 20px 16px",
                borderRight: "1px solid var(--muted)",
                borderBottom: "1px solid var(--muted)",
                borderTop: highlight ? "4px solid var(--accent)" : "4px solid transparent",
                background: highlight ? "#FFF8F8" : "var(--paper)",
                cursor: "default",
                minWidth: 0,
            }}
        >
            {/* Category label */}
            <div
                style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "var(--n500)",
                    marginBottom: 8,
                }}
            >
                {label}
            </div>
            {/* Big serif value */}
            <div
                style={{
                    fontFamily: "'Playfair Display', 'Times New Roman', serif",
                    fontSize: 32,
                    fontWeight: 700,
                    lineHeight: 1.05,
                    letterSpacing: "-0.01em",
                    color: highlight ? "var(--accent)" : "var(--ink)",
                    marginBottom: 6,
                }}
            >
                {value}
            </div>
            {/* Sub-line */}
            {sub && (
                <div
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        color: "var(--n600)",
                        lineHeight: 1.5,
                        borderTop: "1px solid var(--muted)",
                        paddingTop: 6,
                        marginTop: 4,
                    }}
                >
                    {sub}
                </div>
            )}
        </div>
    );
}

export default function FireSummary({ result, targetFireAge, currentYear }: Props) {
    if (!result) {
        return (
            <div
                style={{
                    border: "1px solid var(--ink)",
                    padding: "28px",
                    textAlign: "center",
                    fontFamily: "'Lora', Georgia, serif",
                    fontStyle: "italic",
                    color: "var(--n500)",
                    fontSize: 13,
                    marginBottom: 24,
                }}
            >
                Enter your details in the sidebar to see your FIRE projection...
            </div>
        );
    }

    const last = result.snapshots[result.snapshots.length - 1];

    const leanValue   = result.leanFireAge  ? `Age ${result.leanFireAge}`  : "—";
    const leanSub     = result.leanFireYear
        ? `${result.leanFireYear} · ¥${(
            (result.snapshots.find((s) => s.year === result.leanFireYear)?.portfolio ?? 0) / 1_0000
          ).toFixed(0)}万 portfolio`
        : "Increase savings rate or extend timeline";
    const leanHit     = !!result.leanFireAge;

    const fatValue    = result.fatFireAge   ? `Age ${result.fatFireAge}`   : "—";
    const fatSub      = result.fatFireYear
        ? `${result.fatFireYear} · 1.5× required capital`
        : "Need 1.5× standard FIRE capital";
    const fatHit      = !!result.fatFireAge;

    // SWP monthly income at FIRE
    const swpValue = result.swpMonthlyAtFire > 0
        ? formatYen(Math.round(result.swpMonthlyAtFire))
        : "—";
    const swpSub = result.swpMonthlyAtFire > 0
        ? `SWP to age 90 · portfolio → ¥0`
        : "Set target FIRE age to see SWP";

    // NISA tsumitate exhaustion
    const nisaTValue = result.nisaTsumitateExhaustionAge
        ? `Age ${result.nisaTsumitateExhaustionAge}`
        : "Not full";
    const nisaTSub = result.nisaTsumitateExhaustionYear
        ? `${result.nisaTsumitateExhaustionYear} · ¥6M tsumitate limit`
        : "Tsumitate cap (¥6M) not reached";

    // NISA growth exhaustion
    const nisaGValue = result.nisaGrowthExhaustionAge
        ? `Age ${result.nisaGrowthExhaustionAge}`
        : "Not full";
    const nisaGSub = result.nisaGrowthExhaustionYear
        ? `${result.nisaGrowthExhaustionYear} · ¥12M growth limit`
        : "Growth cap (¥12M) not reached";

    const portfolioVal = last?.portfolio ?? 0;
    const portfolioStr = portfolioVal >= 1_0000_0000
        ? `¥${(portfolioVal / 1_0000_0000).toFixed(1)}億`
        : `¥${(portfolioVal / 1_0000).toFixed(0)}万`;
    const portfolioSub = `At age 90 · ${formatYen(portfolioVal)}`;

    // Depletion
    const depletes = !!result.portfolioDepletionAge;
    const depletionValue = depletes ? `Age ${result.portfolioDepletionAge}` : portfolioStr;
    const depletionLabel = depletes ? "Portfolio Depletes" : "Age-90 Portfolio";
    const depletionSub = depletes
        ? `${result.portfolioDepletionYear} · Portfolio exhausted before 90`
        : portfolioSub;

    return (
        <div
            className="responsive-grid-fire-summary"
            style={{
                border: "1px solid var(--ink)",
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                marginBottom: 0,
            }}
        >
            <StatCard label="Lean FIRE"          value={leanValue}      sub={leanSub}      highlight={leanHit}  />
            <StatCard label="Fat FIRE"            value={fatValue}       sub={fatSub}       highlight={fatHit}   />
            <StatCard label="SWP Monthly Income"  value={swpValue}       sub={swpSub}                            />
            <StatCard label="NISA-T Maxed Out"    value={nisaTValue}     sub={nisaTSub}                          />
            <StatCard label="NISA-G Maxed Out"    value={nisaGValue}     sub={nisaGSub}                          />
            <StatCard label={depletionLabel}      value={depletionValue} sub={depletionSub} isLast highlight={depletes} />
        </div>
    );
}
