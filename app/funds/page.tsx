"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { NISA_FUNDS, NisaFund, SectorWeights } from "@/lib/fireCalculator";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

// ── Live return data interface ──────────────────────────────────────────────
interface ReturnData {
  return1y: number;
  return3y: number;
  return5y: number;
  return10y: number;
}

// ── Sector colour palette (editorial greyscale + accent) ──────────────────────
const SECTOR_COLORS: Record<keyof SectorWeights, string> = {
  "US Equity":      "#111111",
  "Japan Equity":   "#CC0000",
  "Europe Equity":  "#4a4a4a",
  "Emerging Mkts":  "#737373",
  "Japan REIT":     "#A35F00",
  "Global REIT":    "#C88B2A",
  "Bonds":          "#A3A3A3",
  "Other":          "#D4D4C8",
};
const SECTOR_KEYS = Object.keys(SECTOR_COLORS) as (keyof SectorWeights)[];

type SortKey = "return1y" | "return3y" | "return5y" | "return10y" | "expenseRatio" | "expectedReturn";

interface BasketItem { ticker: string; weight: number }

function fmt(n: number, dec = 1) { return n.toFixed(dec); }

function ReturnBadge({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 48, height: 4, background: "var(--muted)", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: value >= 15 ? "#111111" : value >= 10 ? "#4a4a4a" : "#A3A3A3" }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>{fmt(value)}%</span>
    </div>
  );
}

function SectorBar({ weights, showLegend = false }: { weights: SectorWeights; showLegend?: boolean }) {
  const total = SECTOR_KEYS.reduce((s, k) => s + (weights[k] ?? 0), 0);
  if (total === 0) return <div style={{ color: "var(--n400)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>—</div>;
  return (
    <div>
      <div style={{ display: "flex", height: 18, overflow: "hidden", border: "1px solid var(--muted)" }}>
        {SECTOR_KEYS.map((k) => {
          const pct = ((weights[k] ?? 0) / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div key={k} title={`${k}: ${fmt(pct)}%`}
              style={{ width: `${pct}%`, background: SECTOR_COLORS[k], flexShrink: 0 }}
            />
          );
        })}
      </div>
      {showLegend && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 8 }}>
          {SECTOR_KEYS.map((k) => {
            const pct = weights[k] ?? 0;
            if (pct < 0.5) return null;
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, background: SECTOR_COLORS[k], flexShrink: 0 }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--n600)" }}>
                  {k} {fmt(pct, 0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── NISA Eligibility Badge ──────────────────────────────────────────────────
function NisaBadge({ tsumitate, growth }: { tsumitate: boolean; growth: boolean }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8,
        padding: "2px 5px",
        fontWeight: 700,
        background: tsumitate ? "#111111" : "var(--muted)",
        color: tsumitate ? "#ffffff" : "var(--n400)",
        border: "1px solid var(--ink)"
      }}>T</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8,
        padding: "2px 5px",
        fontWeight: 700,
        background: growth ? "#111111" : "var(--muted)",
        color: growth ? "#ffffff" : "var(--n400)",
        border: "1px solid var(--ink)"
      }}>G</span>
    </div>
  );
}

// ── Sparkline Chart (SVG) ────────────────────────────────────────────────────
function Sparkline({ r1, r3, r5, r10 }: { r1: number; r3: number; r5: number; r10: number }) {
  const values = [r1, r3, r5, r10];
  const max = Math.max(...values, 1);
  const bars = values.map((v, i) => ({
    x: i * 14,
    height: Math.max(2, (v / max) * 24),
  }));
  return (
    <svg width={56} height={24} style={{ display: "block", verticalAlign: "middle" }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x + 1} y={24 - b.height} width={10} height={b.height}
          fill="#111111" opacity={0.5 + i * 0.15} />
      ))}
    </svg>
  );
}

const tdR: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "right",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  color: "var(--n700)",
  whiteSpace: "nowrap",
};

export default function FundsPage() {
  const [sortKey, setSortKey] = useState<SortKey>("return5y");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [page, setPage] = useState(0);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [liveReturns, setLiveReturns] = useState<Record<string, ReturnData> | null>(null);
  const [dataStatus, setDataStatus] = useState<"loading" | "live" | "fallback" | "stale">("loading");

  const PAGE_SIZE = 10;

  // ── Fetch live fund return data on mount ────────────────────────────────
  useEffect(() => {
    fetch("/api/fund-returns")
      .then((res) => res.json())
      .then((apiResponse) => {
        // Handle new API response structure with meta data
        if (apiResponse.data && apiResponse.meta) {
          setLiveReturns(apiResponse.data);
          setDataStatus(apiResponse.meta.isStale ? "stale" : "live");
        } else {
          // Fallback for old response format
          setLiveReturns(apiResponse);
          setDataStatus("live");
        }
      })
      .catch(() => {
        setDataStatus("fallback");
      });
  }, []);

  // ── Merge live returns into fund data ──────────────────────────────────
  const funds = useMemo(() =>
    NISA_FUNDS.map((f) =>
      liveReturns?.[f.ticker]
        ? { ...f, ...liveReturns[f.ticker] }
        : f
    ),
    [liveReturns]
  );

  const categories = useMemo(() => Array.from(new Set(funds.map((f) => f.category))), [funds]);

  const filtered = useMemo(() => {
    return funds
      .filter((f) => !filterCat || f.category === filterCat)
      .filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.benchmark.toLowerCase().includes(search.toLowerCase()) || f.ticker.toLowerCase().includes(search.toLowerCase()))
      .slice()
      .sort((a, b) => {
        const av = a[sortKey] as number;
        const bv = b[sortKey] as number;
        return sortDir === "desc" ? bv - av : av - bv;
      });
  }, [sortKey, sortDir, filterCat, search, funds]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filter/search/sort changes
  useEffect(() => {
    setPage(0);
  }, [filterCat, search, sortKey]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }, [sortKey]);

  const isInBasket = (ticker: string) => basket.some((b) => b.ticker === ticker);

  const evenWeights = (items: BasketItem[]): BasketItem[] => {
    if (items.length === 0) return [];
    const w = Math.floor(100 / items.length);
    const remainder = 100 - w * items.length;
    return items.map((b, i) => ({ ...b, weight: w + (i === 0 ? remainder : 0) }));
  };

  const addToBasket = (fund: NisaFund) => {
    if (isInBasket(fund.ticker)) return;
    setBasket((prev) => evenWeights([...prev, { ticker: fund.ticker, weight: 0 }]));
  };

  const removeFromBasket = (ticker: string) =>
    setBasket((prev) => evenWeights(prev.filter((b) => b.ticker !== ticker)));

  const updateWeight = (ticker: string, weight: number) =>
    setBasket((prev) => prev.map((b) => (b.ticker === ticker ? { ...b, weight } : b)));

  const normaliseWeights = () => {
    const total = basket.reduce((s, b) => s + b.weight, 0);
    if (total === 0) return;
    setBasket((prev) => prev.map((b) => ({ ...b, weight: Math.round((b.weight / total) * 100) })));
  };

  const basketTotal = basket.reduce((s, b) => s + b.weight, 0);

  const basketStats = useMemo(() => {
    if (basket.length === 0) return null;
    const total = basket.reduce((s, b) => s + b.weight, 0);
    if (total === 0) return null;
    let r1 = 0, r3 = 0, r5 = 0, r10 = 0, exp = 0, expectedRet = 0;
    const blended: SectorWeights = { "US Equity": 0, "Japan Equity": 0, "Europe Equity": 0, "Emerging Mkts": 0, "Japan REIT": 0, "Global REIT": 0, "Bonds": 0, "Other": 0 };
    for (const item of basket) {
      const fund = funds.find((f) => f.ticker === item.ticker);
      if (!fund) continue;
      const w = item.weight / total;
      r1 += fund.return1y * w;
      r3 += fund.return3y * w;
      r5 += fund.return5y * w;
      r10 += fund.return10y * w;
      exp += fund.expenseRatio * w;
      expectedRet += fund.expectedReturn * w;
      for (const k of SECTOR_KEYS) { blended[k] = (blended[k] ?? 0) + (fund.sectorWeights[k] ?? 0) * w; }
    }
    return { r1, r3, r5, r10, exp, expectedRet, blended };
  }, [basket, funds]);

  const maxReturn = Math.max(...funds.map((f) => f.return5y));

  const ColHead = ({ label, sk }: { label: string; sk: SortKey }) => (
    <th onClick={() => toggleSort(sk)} style={{
      padding: "8px 12px", textAlign: "right",
      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
      color: sortKey === sk ? "#F9F9F7" : "rgba(255,255,255,0.5)",
      cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
      background: sortKey === sk ? "rgba(255,255,255,0.08)" : "transparent",
    }}>
      {label} {sortKey === sk ? (sortDir === "desc" ? "↓" : "↑") : ""}
    </th>
  );

  return (
    <>
      {/* Masthead */}
      <div style={{ borderBottom: "4px solid var(--ink)", paddingBottom: 6, marginBottom: 20, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 4 }}>NISA Fund Guide</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>Fund Encyclopedia & Basket Builder</div>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--n500)", textAlign: "right", lineHeight: 1.6 }}>
          {filtered.length} funds · Returns in JPY · Annualised<br />
          <span style={{ color: dataStatus === "live" ? "#2a7a2a" : dataStatus === "stale" ? "#C88B2A" : "var(--n500)" }}>
            {dataStatus === "loading" ? "Fetching live data..." : dataStatus === "live" ? "● Live · Yahoo Finance" : dataStatus === "stale" ? "⚠ Cached data" : "● Estimates"}
          </span>
        </div>
      </div>

      <div className="funds-layout" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* ── LEFT: Encyclopedia ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search input */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fund name or benchmark..."
            style={{ width: "100%", marginBottom: 12, padding: "7px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, border: "1px solid var(--ink)", boxSizing: "border-box" }}
          />

          {/* Category chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {[null, ...categories].map((cat) => (
              <button key={cat ?? "all"} onClick={() => setFilterCat(cat)} style={{
                padding: "3px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
                border: "1px solid var(--ink)",
                background: filterCat === cat ? "var(--ink)" : "transparent",
                color: filterCat === cat ? "var(--paper)" : "var(--n600)",
                transition: "all 0.1s",
              }}>
                {cat ?? "All"}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ border: "1px solid var(--ink)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--ink)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>Fund</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>NISA</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>Chart</th>
                  <ColHead label="1yr" sk="return1y" />
                  <ColHead label="3yr" sk="return3y" />
                  <ColHead label="5yr ●" sk="return5y" />
                  <ColHead label="10yr" sk="return10y" />
                  <ColHead label="Fee" sk="expenseRatio" />
                  <ColHead label="Est. Return" sk="expectedReturn" />
                  <th style={{ padding: "8px 12px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>Exposure</th>
                  <th style={{ padding: "8px 12px" }}></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((fund, i) => {
                  const inBasket = isInBasket(fund.ticker);
                  const isExpanded = expandedTicker === fund.ticker;
                  const chartData = [
                    { period: "1yr", return: fund.return1y },
                    { period: "3yr", return: fund.return3y },
                    { period: "5yr", return: fund.return5y },
                    { period: "10yr", return: fund.return10y },
                    { period: "Est.", return: fund.expectedReturn },
                  ];
                  return (
                    <React.Fragment key={fund.ticker}>
                      <tr style={{
                        borderTop: "1px solid var(--muted)",
                        background: inBasket ? "#FFF8F8" : i % 2 === 0 ? "var(--paper)" : "var(--n100)",
                        transition: "background 0.1s",
                        cursor: "pointer",
                      }} onClick={() => setExpandedTicker(isExpanded ? null : fund.ticker)}>
                        <td style={{ padding: "12px 12px 10px", minWidth: 180, maxWidth: 220 }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: inBasket ? "var(--accent)" : "var(--n500)", marginBottom: 3 }}>{fund.category}</div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3, marginBottom: 2 }}>{fund.name}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--n500)" }}>{fund.ticker}</div>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <NisaBadge tsumitate={fund.nisaTsumitateEligible} growth={fund.nisaGrowthEligible} />
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <Sparkline r1={fund.return1y} r3={fund.return3y} r5={fund.return5y} r10={fund.return10y} />
                        </td>
                        <td style={tdR}>{fmt(fund.return1y)}%</td>
                        <td style={tdR}>{fmt(fund.return3y)}%</td>
                        <td style={tdR}><ReturnBadge value={fund.return5y} max={maxReturn} /></td>
                        <td style={tdR}>{fmt(fund.return10y)}%</td>
                        <td style={{ ...tdR, color: fund.expenseRatio < 0.1 ? "#2a7a2a" : "var(--n700)" }}>{fmt(fund.expenseRatio, 4)}%</td>
                        <td style={{ ...tdR, fontWeight: 700, color: "var(--ink)" }}>{fmt(fund.expectedReturn)}%</td>
                        <td style={{ padding: "10px 12px", minWidth: 120 }}><SectorBar weights={fund.sectorWeights} /></td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>
                          <button onClick={(e) => { e.stopPropagation(); inBasket ? removeFromBasket(fund.ticker) : addToBasket(fund); }} style={{
                            padding: "5px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                            fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                            border: inBasket ? "1px solid var(--accent)" : "1px solid var(--ink)",
                            background: inBasket ? "#FFF0F0" : "transparent",
                            color: inBasket ? "var(--accent)" : "var(--ink)",
                            transition: "all 0.12s", whiteSpace: "nowrap",
                          }}>
                            {inBasket ? "✕ Remove" : "+ Basket"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ borderTop: "1px solid var(--muted)", background: "var(--n100)" }}>
                          <td colSpan={10} style={{ padding: "16px 12px" }}>
                            <div className="responsive-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                              {/* Left: Description and details */}
                              <div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 8 }}>About This Fund</div>
                                <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, fontStyle: "italic", color: "var(--n600)", lineHeight: 1.6, marginBottom: 12 }}>
                                  {fund.description}
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                                  <div>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 4 }}>Benchmark</div>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{fund.benchmark}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 4 }}>Expense Ratio</div>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: fund.expenseRatio < 0.1 ? "#2a7a2a" : "var(--ink)" }}>{fmt(fund.expenseRatio, 4)}%</div>
                                  </div>
                                </div>
                                <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--paper)", border: "1px solid var(--muted)" }}>
                                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 6 }}>NISA Eligibility</div>
                                  <div style={{ display: "flex", gap: 12 }}>
                                    <div>
                                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: fund.nisaTsumitateEligible ? "#2a7a2a" : "var(--accent)" }}>
                                        {fund.nisaTsumitateEligible ? "✓ Tsumitate" : "✗ Tsumitate"}
                                      </div>
                                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "var(--n500)", marginTop: 2 }}>積立投資枠</div>
                                    </div>
                                    <div>
                                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: fund.nisaGrowthEligible ? "#2a7a2a" : "var(--accent)" }}>
                                        {fund.nisaGrowthEligible ? "✓ Growth" : "✗ Growth"}
                                      </div>
                                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "var(--n500)", marginTop: 2 }}>成長投資枠</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Right: Chart */}
                              <div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 8 }}>Return History</div>
                                <ResponsiveContainer width="100%" height={140}>
                                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                                    <XAxis dataKey="period" fontSize={9} fontFamily="JetBrains Mono" />
                                    <YAxis fontSize={9} fontFamily="JetBrains Mono" unit="%" width={32} />
                                    <Tooltip formatter={(v) => `${fmt(v as number)}%`} contentStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }} />
                                    <Bar dataKey="return" radius={[1, 1, 0, 0]}>
                                      {chartData.map((_, idx) => (
                                        <Cell key={idx} fill={idx < 4 ? "#4a4a4a" : "var(--accent)"} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--n600)", marginTop: 8, textAlign: "center" }}>
                                  Gray = historical, Red = estimated
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderTop: "1px solid var(--ink)", background: "var(--paper)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ color: "var(--n500)" }}>
              {filtered.length === 0 ? "No funds" : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: "4px 8px", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.5 : 1, border: "1px solid var(--ink)" }}>←</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{ padding: "4px 8px", fontWeight: page === i ? 700 : 400, cursor: "pointer", border: "1px solid var(--ink)", background: page === i ? "var(--ink)" : "transparent", color: page === i ? "var(--paper)" : "var(--ink)" }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ padding: "4px 8px", cursor: page >= totalPages - 1 ? "default" : "pointer", opacity: page >= totalPages - 1 ? 0.5 : 1, border: "1px solid var(--ink)" }}>→</button>
            </div>
          </div>

          {/* Sector legend */}
          <div style={{ marginTop: 10, display: "flex", gap: "4px 14px", flexWrap: "wrap" }}>
            {SECTOR_KEYS.map((k) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, background: SECTOR_COLORS[k] }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--n500)", letterSpacing: "0.06em" }}>{k}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: "12px 16px", border: "1px solid var(--muted)", background: "var(--n100)" }}>
            <p style={{ margin: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 11, fontStyle: "italic", color: "var(--n600)", lineHeight: 1.7 }}>
              Returns are approximate annualised figures in JPY including currency effects. Historical estimates — past performance does not guarantee future results. Expense ratios from fund prospectuses. Sector allocations are simplified approximations.
            </p>
          </div>
        </div>

        {/* ── RIGHT: Basket Builder ── */}
        <div className="funds-basket" style={{ width: 300, flexShrink: 0 }}>
          <div style={{ borderBottom: "2px solid var(--ink)", paddingBottom: 8, marginBottom: 14 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 3 }}>Portfolio Basket</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>Build Your Mix</div>
          </div>

          {basket.length === 0 ? (
            <div style={{ border: "1px dashed var(--muted)", padding: "28px 16px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, fontStyle: "italic", color: "var(--n500)", lineHeight: 1.6 }}>
                Click <strong style={{ fontStyle: "normal" }}>+ Basket</strong> on any fund to build your portfolio mix.
              </div>
            </div>
          ) : (
            <>
              {/* Weight total */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--n500)" }}>Allocation Total</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: Math.abs(basketTotal - 100) <= 1 ? "#2a7a2a" : "var(--accent)" }}>
                  {basketTotal}%
                </span>
              </div>

              {/* Fund rows */}
              {basket.map((item) => {
                const fund = funds.find((f) => f.ticker === item.ticker);
                if (!fund) return null;
                return (
                  <div key={item.ticker} style={{ border: "1px solid var(--muted)", padding: "10px 12px", marginBottom: 8, background: "var(--paper)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ flex: 1, marginRight: 8 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>{fund.name}</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--n500)", marginTop: 2 }}>
                          5yr: {fmt(fund.return5y)}% · Fee: {fmt(fund.expenseRatio, 4)}%
                        </div>
                      </div>
                      <button onClick={() => removeFromBasket(item.ticker)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: "0 2px", lineHeight: 1 }}>✕</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="range" min={0} max={100} step={1} value={item.weight}
                        onChange={(e) => updateWeight(item.ticker, Number(e.target.value))}
                        style={{ flex: 1 }} />
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "var(--accent)", minWidth: 36, textAlign: "right" }}>
                        {item.weight}%
                      </span>
                    </div>
                  </div>
                );
              })}

              <button onClick={normaliseWeights} style={{
                width: "100%", padding: "8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer",
                border: "1px solid var(--ink)", background: "transparent", color: "var(--n600)", marginBottom: 16,
              }}>
                Normalise to 100%
              </button>

              {/* Analytics */}
              {basketStats && (
                <div style={{ border: "1px solid var(--ink)", padding: "14px 14px 12px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 10 }}>Basket Analytics</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 0", marginBottom: 14 }}>
                    {[["1yr avg", basketStats.r1], ["3yr avg", basketStats.r3], ["5yr avg", basketStats.r5], ["10yr avg", basketStats.r10]].map(([label, val]) => (
                      <div key={label as string} style={{ paddingRight: 8 }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 2 }}>{label}</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{fmt(val as number)}%</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 0, borderTop: "1px solid var(--muted)", paddingTop: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1, borderRight: "1px solid var(--muted)", paddingRight: 10 }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 2 }}>Avg Fee</div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: basketStats.exp < 0.1 ? "#2a7a2a" : "var(--ink)" }}>{fmt(basketStats.exp, 4)}%</div>
                    </div>
                    <div style={{ flex: 1, paddingLeft: 10 }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 2 }}>Est. Return</div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{fmt(basketStats.expectedRet)}%</div>
                    </div>
                  </div>

                  {/* Sector exposure */}
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--n500)", marginBottom: 8 }}>Sector Exposure</div>
                  <SectorBar weights={basketStats.blended} showLegend />

                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                    {SECTOR_KEYS.map((k) => {
                      const pct = basketStats.blended[k] ?? 0;
                      if (pct < 0.5) return null;
                      return (
                        <div key={k}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--n600)" }}>{k}</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: "var(--ink)" }}>{fmt((pct / SECTOR_KEYS.reduce((s, kk) => s + (basketStats.blended[kk] ?? 0), 0)) * 100, 1)}%</span>
                          </div>
                          <div style={{ height: 3, background: "var(--muted)" }}>
                            <div style={{ height: "100%", width: `${(pct / SECTOR_KEYS.reduce((s, kk) => s + (basketStats.blended[kk] ?? 0), 0)) * 100}%`, background: SECTOR_COLORS[k] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(basketStats.blended["US Equity"] ?? 0) > 60 && (
                    <div style={{ marginTop: 12, padding: "8px 10px", background: "#FFF8F8", border: "1px solid var(--accent)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--accent)", lineHeight: 1.5 }}>
                      ⚠ US overweight ({fmt(basketStats.blended["US Equity"])}%). Consider bonds, REIT or EM.
                    </div>
                  )}
                  {(basketStats.blended["Emerging Mkts"] ?? 0) > 40 && (
                    <div style={{ marginTop: 8, padding: "8px 10px", background: "#FFF8F8", border: "1px solid var(--accent)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--accent)", lineHeight: 1.5 }}>
                      ⚠ High EM exposure ({fmt(basketStats.blended["Emerging Mkts"])}%). Expect higher volatility.
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setBasket([])} style={{
                width: "100%", marginTop: 10, padding: "7px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer",
                border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)",
              }}>
                Clear Basket
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
