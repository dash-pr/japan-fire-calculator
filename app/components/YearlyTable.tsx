"use client";

import React, { useMemo } from "react";
import { MonthlySnapshot, SimulationResult } from "@/lib/fireCalculator";
import { formatYen } from "@/lib/fireCalculator";

interface Props {
    result: SimulationResult | null;
    maxTableHeight?: number | "none";
}

export default function YearlyTable({ result, maxTableHeight = 360 }: Props) {
    // Build yearly snapshot (December each year)
    const rows = useMemo(() => {
        if (!result) return [];
        const byYear = new Map<number, MonthlySnapshot>();
        for (const s of result.snapshots) {
            byYear.set(s.year, s);
        }
        return Array.from(byYear.entries())
            .sort(([a], [b]) => a - b)
            .map(([, snap]) => snap);
    }, [result]);

    if (!result || rows.length === 0) return null;

    const leanYear = result.leanFireYear;
    const fatYear = result.fatFireYear;

    return (
        <div
            style={{
                border: "1px solid var(--ink)",
                overflow: "hidden",
                marginTop: 16,
            }}
        >
            <div
                style={{
                    padding: "14px 20px 12px",
                    borderBottom: "4px solid var(--ink)",
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                }}
            >
                <div
                    style={{
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 700,
                        fontSize: 17,
                        letterSpacing: "-0.01em",
                        color: "var(--ink)",
                    }}
                >
                    Year-by-Year Breakdown
                </div>
                <div
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--n500)",
                    }}
                >
                    Dec snapshot · each year
                </div>
            </div>
            <div style={{ overflowX: "auto", maxHeight: maxTableHeight === "none" ? undefined : maxTableHeight, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                        <tr
                            style={{
                                background: "var(--ink)",
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                            }}
                        >
                            {["Year", "Age", "Total Portfolio", "iDeCo", "NISA-T", "NISA-G", "Taxable", "SWP/mo", "Monthly Exp.", "Status"].map(
                                (h) => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: "8px 14px",
                                            textAlign: "right",
                                            fontWeight: 700,
                                            color: "rgba(255,255,255,0.5)",
                                            letterSpacing: "0.14em",
                                            fontSize: 9,
                                            textTransform: "uppercase",
                                            whiteSpace: "nowrap",
                                            fontFamily: "'JetBrains Mono', monospace",
                                        }}
                                    >
                                        {h}
                                    </th>
                                )
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((snap, i) => {
                            const isFat = fatYear && snap.year >= fatYear;
                            const isLean = leanYear && snap.year >= leanYear;
                            const rowBg = isFat
                                ? "#FFF8F8"
                                : isLean
                                    ? "var(--n100)"
                                    : undefined;

                            const status = isFat ? (
                                <span
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        color: "#F9F9F7",
                                        fontWeight: 700,
                                        fontSize: 9,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                        background: "#CC0000",
                                        padding: "2px 7px",
                                    }}
                                >
                                    Fat FIRE
                                </span>
                            ) : isLean ? (
                                <span
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        color: "var(--ink)",
                                        fontWeight: 700,
                                        fontSize: 9,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                        border: "1px solid var(--ink)",
                                        padding: "2px 7px",
                                    }}
                                >
                                    Lean FIRE
                                </span>
                            ) : (
                                <span
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        color: "var(--n400)",
                                        fontSize: 9,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Accumulating
                                </span>
                            );

                            return (
                                <tr
                                    key={snap.year}
                                    style={{
                                        background: rowBg,
                                        transition: "background 0.12s",
                                    }}
                                >
                                    <td style={tdStyle}>{snap.year}</td>
                                    <td style={tdStyle}>{snap.age}</td>
                                    <td style={{ ...tdStyle, color: "var(--ink)", fontWeight: 700, fontFamily: "'Playfair Display', serif", fontSize: 13 }}>
                                        {formatYen(snap.portfolio)}
                                    </td>
                                    <td style={{ ...tdStyle, color: "var(--n700)" }}>
                                        {snap.ideco > 0 ? formatYen(snap.ideco) : "—"}
                                    </td>
                                    <td style={{ ...tdStyle, color: "var(--ink)" }}>
                                        {snap.nisaTsumitate > 0 ? formatYen(snap.nisaTsumitate) : "—"}
                                    </td>
                                    <td style={{ ...tdStyle, color: "var(--ink)" }}>
                                        {snap.nisaGrowth > 0 ? formatYen(snap.nisaGrowth) : "—"}
                                    </td>
                                    <td style={{ ...tdStyle, color: "var(--n500)" }}>
                                        {snap.taxable > 0 ? formatYen(snap.taxable) : "—"}
                                    </td>
                                    <td style={{ ...tdStyle, color: snap.swpWithdrawal > 0 ? "#CC6600" : "var(--n300)" }}>
                                        {snap.swpWithdrawal > 0 ? formatYen(snap.swpWithdrawal) : "—"}
                                    </td>
                                    <td style={tdStyle}>{formatYen(snap.monthlyExpenses)}/mo</td>
                                    <td style={{ ...tdStyle, textAlign: "center" }}>{status}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const tdStyle: React.CSSProperties = {
    padding: "8px 14px",
    textAlign: "right",
    color: "var(--n600)",
    whiteSpace: "nowrap",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    borderTop: "1px solid var(--muted)",
};
