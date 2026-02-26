"use client";

import React, { useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { MonthlySnapshot, SimulationResult } from "@/lib/fireCalculator";
import { formatYen } from "@/lib/fireCalculator";

interface Props {
    result: SimulationResult | null;
}

function formatYenAxis(v: number) {
    if (v >= 1_0000_0000) return `¥${(v / 1_0000_0000).toFixed(0)}億`;
    if (v >= 1_0000) return `¥${(v / 1_0000).toFixed(0)}万`;
    return `¥${v}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const snap: MonthlySnapshot = payload[0]?.payload?._snap;
        if (!snap) return null;
        const total = snap.portfolio;
        return (
            <div
                style={{
                    background: "#111111",
                    border: "1px solid #111111",
                    padding: "12px 16px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    minWidth: 210,
                }}
            >
                <div
                    style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#F9F9F7",
                        marginBottom: 8,
                        borderBottom: "1px solid rgba(255,255,255,0.15)",
                        paddingBottom: 6,
                    }}
                >
                    {label} · Age {snap.age}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Row label="Total Portfolio"     value={formatYen(total)}                            color="#F9F9F7"             bold />
                    <Row label="iDeCo"               value={formatYen(snap.ideco)}                      color="#A3A3A3"                  />
                    <Row label="NISA Tsumitate"       value={formatYen(snap.nisaTsumitate)}              color="#D4D4C8"                  />
                    <Row label="NISA Growth"          value={formatYen(snap.nisaGrowth)}                 color="#E5E5E0"                  />
                    <Row label="Taxable"              value={formatYen(snap.taxable)}                    color="#737373"                  />
                    {snap.swpWithdrawal > 0 && <Row label="SWP Withdrawal" value={formatYen(snap.swpWithdrawal)} color="#CC6600" />}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "4px 0" }} />
                    <Row label="FIRE Capital Needed" value={formatYen(snap.requiredCapital)}             color="#CC0000"                 />
                    <Row label="Monthly Expenses"    value={formatYen(snap.monthlyExpenses + snap.loanPayment)}             color="rgba(255,255,255,0.35)" />
                </div>
            </div>
        );
    }
    return null;
};

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.06em" }}>{label}</span>
            <span style={{ color, fontWeight: bold ? 700 : 500 }}>{value}</span>
        </div>
    );
}

export default function PortfolioChart({ result }: Props) {
    // Downsample to yearly snapshots (Dec of each year)
    const chartData = useMemo(() => {
        if (!result) return [];
        const byYear = new Map<number, MonthlySnapshot>();
        for (const s of result.snapshots) {
            byYear.set(s.year, s); // overwrite → keeps Dec
        }
        return Array.from(byYear.entries())
            .sort(([a], [b]) => a - b)
            .map(([year, snap]) => ({
                year: String(year),
                ideco: snap.ideco,
                nisaTsumitate: snap.nisaTsumitate,
                nisaGrowth: snap.nisaGrowth,
                taxable: snap.taxable,
                required: snap.requiredCapital,
                fatRequired: snap.fatFireCapital,
                _snap: snap,
            }));
    }, [result]);

    if (!result || chartData.length === 0) {
        return (
            <div
                style={{
                    height: 320,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--ink)",
                    fontFamily: "'Lora', Georgia, serif",
                    fontStyle: "italic",
                    color: "var(--n500)",
                    fontSize: 13,
                }}
            >
                No data yet
            </div>
        );
    }

    const leanYear = result.leanFireYear?.toString();
    const fatYear = result.fatFireYear?.toString();
    const depletionYear = result.portfolioDepletionYear?.toString();

    return (
        <div
            style={{
                border: "1px solid var(--ink)",
                padding: "20px 4px 16px 0",
                background: "var(--paper)",
            }}
        >
            <div
                className="chart-header-row"
                style={{
                    padding: "0 20px 14px",
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--muted)",
                    marginBottom: 16,
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
                    Portfolio Growth
                </div>
                <div className="chart-indicators" style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    {leanYear && (
                        <span
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: "var(--n600)",
                            }}
                        >
                            Lean FIRE {leanYear}
                        </span>
                    )}
                    {fatYear && (
                        <span
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: "var(--accent)",
                            }}
                        >
                            &#9632; Fat FIRE {fatYear}
                        </span>
                    )}
                    {depletionYear && (
                        <span
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: "#CC0000",
                                fontWeight: 700,
                            }}
                        >
                            ⚠ Depletes {depletionYear}
                        </span>
                    )}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={360}>
                <AreaChart data={chartData} margin={{ top: 40, right: 24, left: 16, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gIdeco" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#404040" stopOpacity={0.55} />
                            <stop offset="95%" stopColor="#404040" stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id="gNisaT" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#1a1a1a" stopOpacity={0.65} />
                            <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0.04} />
                        </linearGradient>
                        <linearGradient id="gNisaG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#4a4a4a" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#4a4a4a" stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id="gTaxable" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#A3A3A3" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#A3A3A3" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(17,17,17,0.08)" horizontal={true} vertical={false} />
                    <XAxis
                        dataKey="year"
                        tick={{ fill: "#737373", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                        tickLine={false}
                        axisLine={{ stroke: "#111111", strokeWidth: 1 }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tickFormatter={formatYenAxis}
                        tick={{ fill: "#737373", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                        tickLine={false}
                        axisLine={false}
                        width={72}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#111111", strokeWidth: 1, strokeDasharray: "3 3" }} />
                    {/* Required capital — editorial red dashed line */}
                    <Area
                        type="monotone"
                        dataKey="required"
                        stroke="#CC0000"
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        fill="none"
                        name="FIRE Capital"
                        dot={false}
                    />
                    {/* Stacked portfolio areas — greyscale */}
                    <Area
                        type="monotone"
                        dataKey="ideco"
                        stackId="portfolio"
                        stroke="#404040"
                        strokeWidth={1}
                        fill="url(#gIdeco)"
                        name="iDeCo"
                        dot={false}
                    />
                    <Area
                        type="monotone"
                        dataKey="nisaTsumitate"
                        stackId="portfolio"
                        stroke="#1a1a1a"
                        strokeWidth={1}
                        fill="url(#gNisaT)"
                        name="NISA Tsumitate"
                        dot={false}
                    />
                    <Area
                        type="monotone"
                        dataKey="nisaGrowth"
                        stackId="portfolio"
                        stroke="#4a4a4a"
                        strokeWidth={1}
                        fill="url(#gNisaG)"
                        name="NISA Growth"
                        dot={false}
                    />
                    <Area
                        type="monotone"
                        dataKey="taxable"
                        stackId="portfolio"
                        stroke="#A3A3A3"
                        strokeWidth={1}
                        fill="url(#gTaxable)"
                        name="Taxable"
                        dot={false}
                    />
                    {leanYear && (
                        <ReferenceLine
                            x={leanYear}
                            stroke="#111111"
                            strokeDasharray="4 2"
                            strokeWidth={1.5}
                            label={{
                                value: "LEAN",
                                position: "top",
                                fill: "#111111",
                                fontSize: 9,
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        />
                    )}
                    {fatYear && (
                        <ReferenceLine
                            x={fatYear}
                            stroke="#CC0000"
                            strokeDasharray="4 2"
                            strokeWidth={1.5}
                            label={{
                                value: "FAT",
                                position: "top",
                                fill: "#CC0000",
                                fontSize: 9,
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        />
                    )}
                    {depletionYear && (
                        <ReferenceLine
                            x={depletionYear}
                            stroke="#CC0000"
                            strokeWidth={2}
                            label={{
                                value: "DEPLETED",
                                position: "insideTopRight",
                                fill: "#CC0000",
                                fontSize: 9,
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        />
                    )}
                    <Legend
                        wrapperStyle={{ fontSize: 10, paddingTop: 12, paddingLeft: 20, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}
                        formatter={(value) => <span style={{ color: "#737373" }}>{value}</span>}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
