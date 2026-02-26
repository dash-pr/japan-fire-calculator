"use client";

import React, { useMemo, useState } from "react";
import {
    AreaChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
    Legend,
    ComposedChart,
} from "recharts";
import { MonthlySnapshot, SimulationResult } from "@/lib/fireCalculator";
import { formatYen } from "@/lib/fireCalculator";

interface Props {
    result: SimulationResult | null;
}

interface VisibilityState {
    total: boolean;
    ideco: boolean;
    nisaTsumitate: boolean;
    nisaGrowth: boolean;
    taxable: boolean;
    spending: boolean;
    swp: boolean;
    fireLines: boolean;
}

// Distinct colors for each account type
const COLORS = {
    total: { stroke: "#F9F9F7", fill: "rgba(249,249,247,0.1)" },
    ideco: { stroke: "#4169E1", fill: "rgba(65,105,225,0.6)", gradient: "gIdeco" },
    nisaTsumitate: { stroke: "#32CD32", fill: "rgba(50,205,50,0.6)", gradient: "gNisaT" },
    nisaGrowth: { stroke: "#FFD700", fill: "rgba(255,215,0,0.6)", gradient: "gNisaG" },
    taxable: { stroke: "#9370DB", fill: "rgba(147,112,219,0.6)", gradient: "gTaxable" },
    spending: { stroke: "#FF6B6B", fill: "none" },
    swp: { stroke: "#4ECDC4", fill: "none" },
};

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
                    <Row label="iDeCo"               value={formatYen(snap.ideco)}                      color="#4169E1"                  />
                    <Row label="NISA Tsumitate"       value={formatYen(snap.nisaTsumitate)}              color="#32CD32"                  />
                    <Row label="NISA Growth"          value={formatYen(snap.nisaGrowth)}                 color="#FFD700"                  />
                    <Row label="Taxable"              value={formatYen(snap.taxable)}                    color="#9370DB"                  />
                    {snap.swpWithdrawal > 0 && <Row label="SWP Withdrawal" value={formatYen(snap.swpWithdrawal)} color="#4ECDC4" />}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "4px 0" }} />
                    <Row label="FIRE Capital Needed" value={formatYen(snap.requiredCapital)}             color="#CC0000"                 />
                    <Row label="Monthly Expenses"    value={formatYen(snap.monthlyExpenses + snap.loanPayment)}             color="#FF6B6B" />
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
    const [visibility, setVisibility] = useState<VisibilityState>({
        total: true,
        ideco: false,
        nisaTsumitate: false,
        nisaGrowth: false,
        taxable: false,
        spending: true,
        swp: true,
        fireLines: true,
    });

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
                portfolio: snap.portfolio,
                spending: (snap.monthlyExpenses + snap.loanPayment) * 12,
                swp: snap.swpWithdrawal * 12,
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

    // Toggle button component
    const ToggleButton = ({ label, color, checked }: { label: string; color: string; checked: boolean }) => (
        <label
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                userSelect: "none",
                opacity: checked ? 1 : 0.5,
            }}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                    const key = label.toLowerCase().replace(/[\s\/]/g, "") as keyof VisibilityState;
                    setVisibility((prev) => ({ ...prev, [key]: e.target.checked }));
                }}
                style={{
                    cursor: "pointer",
                    accentColor: color,
                }}
            />
            <span
                style={{
                    width: 12,
                    height: 2,
                    background: color,
                    display: "inline-block",
                }}
            />
            <span
                style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                }}
            >
                {label}
            </span>
        </label>
    );

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

            {/* ── Toggle Controls ── */}
            <div
                style={{
                    padding: "12px 20px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 16,
                    borderBottom: "1px solid rgba(17,17,17,0.08)",
                    marginBottom: 16,
                    fontSize: 9,
                }}
            >
                <ToggleButton label="Total Portfolio" color={COLORS.total.stroke} checked={visibility.total} />
                <ToggleButton label="iDeCo" color={COLORS.ideco.stroke} checked={visibility.ideco} />
                <ToggleButton label="NISA Tsumitate" color={COLORS.nisaTsumitate.stroke} checked={visibility.nisaTsumitate} />
                <ToggleButton label="NISA Growth" color={COLORS.nisaGrowth.stroke} checked={visibility.nisaGrowth} />
                <ToggleButton label="Taxable" color={COLORS.taxable.stroke} checked={visibility.taxable} />
                <div style={{ marginLeft: "auto" }} />
                <ToggleButton label="Spending" color={COLORS.spending.stroke} checked={visibility.spending} />
                <ToggleButton label="Max SWP" color={COLORS.swp.stroke} checked={visibility.swp} />
                <ToggleButton label="FIRE Lines" color="#CC0000" checked={visibility.fireLines} />
            </div>

            <ResponsiveContainer width="100%" height={360}>
                <AreaChart data={chartData} margin={{ top: 40, right: 24, left: 16, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gIdeco" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#4169E1" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#4169E1" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gNisaT" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#32CD32" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#32CD32" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gNisaG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#FFD700" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#FFD700" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gTaxable" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#9370DB" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#9370DB" stopOpacity={0.05} />
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

                    {/* Total portfolio line (top) */}
                    {visibility.total && (
                        <Line
                            type="monotone"
                            dataKey="portfolio"
                            stroke={COLORS.total.stroke}
                            strokeWidth={2.5}
                            fill="none"
                            name="Total Portfolio"
                            dot={false}
                        />
                    )}

                    {/* Stacked portfolio areas — with distinct colors */}
                    {visibility.ideco && (
                        <Area
                            type="monotone"
                            dataKey="ideco"
                            stackId="portfolio"
                            stroke={COLORS.ideco.stroke}
                            strokeWidth={1}
                            fill="url(#gIdeco)"
                            name="iDeCo"
                            dot={false}
                        />
                    )}
                    {visibility.nisaTsumitate && (
                        <Area
                            type="monotone"
                            dataKey="nisaTsumitate"
                            stackId="portfolio"
                            stroke={COLORS.nisaTsumitate.stroke}
                            strokeWidth={1}
                            fill="url(#gNisaT)"
                            name="NISA Tsumitate"
                            dot={false}
                        />
                    )}
                    {visibility.nisaGrowth && (
                        <Area
                            type="monotone"
                            dataKey="nisaGrowth"
                            stackId="portfolio"
                            stroke={COLORS.nisaGrowth.stroke}
                            strokeWidth={1}
                            fill="url(#gNisaG)"
                            name="NISA Growth"
                            dot={false}
                        />
                    )}
                    {visibility.taxable && (
                        <Area
                            type="monotone"
                            dataKey="taxable"
                            stackId="portfolio"
                            stroke={COLORS.taxable.stroke}
                            strokeWidth={1}
                            fill="url(#gTaxable)"
                            name="Taxable"
                            dot={false}
                        />
                    )}

                    {/* Spending line */}
                    {visibility.spending && (
                        <Line
                            type="monotone"
                            dataKey="spending"
                            stroke={COLORS.spending.stroke}
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            fill="none"
                            name="Annual Spending"
                            dot={false}
                        />
                    )}

                    {/* Max SWP line */}
                    {visibility.swp && (
                        <Line
                            type="monotone"
                            dataKey="swp"
                            stroke={COLORS.swp.stroke}
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            fill="none"
                            name="Max SWP"
                            dot={false}
                        />
                    )}

                    {/* Required capital — editorial red dashed line */}
                    {visibility.fireLines && (
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
                    )}
                    {visibility.fireLines && leanYear && (
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
                    {visibility.fireLines && fatYear && (
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
                    {visibility.fireLines && depletionYear && (
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
