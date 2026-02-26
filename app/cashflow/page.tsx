"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useSimulator } from "@/app/context/SimulatorContext";
import { formatYen } from "@/lib/fireCalculator";

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  expenses:   "#CC0000",
  loans:      "#C44569",
  ideco:      "#2C5F8A",
  nisaT:      "#3A8A4A",
  nisaG:      "#5BBF6B",
  taxable:    "#8A7A5A",
  surplus:    "#C8C0A8",
  swp:        "#CC6600",
  sideIncome: "#8B5CF6",
  expRet:     "#E88080",
};

const yFmt = (v: number) =>
  Math.abs(v) >= 1_0000_0000
    ? `¥${(v / 1_0000_0000).toFixed(1)}億`
    : Math.abs(v) >= 1_0000
    ? `¥${(v / 1_0000).toFixed(0)}万`
    : `¥${v.toLocaleString()}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.15)",
        padding: "10px 14px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: "#F9F9F7",
        minWidth: 190,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: 6,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          paddingBottom: 4,
        }}
      >
        {label}
      </div>
      {payload.map((p: { color: string; name: string; value: number }) => (
        <div
          key={p.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 3,
          }}
        >
          <span style={{ color: p.color }}>{p.name}</span>
          <span>{yFmt(Math.abs(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 19,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: "var(--ink)",
        marginBottom: 4,
        borderBottom: "3px solid var(--ink)",
        paddingBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

export default function CashFlowPage() {
  const { result, targetFireAge } = useSimulator();

  // Build yearly rows from December snapshot (one per year)
  const allRows = useMemo(() => {
    if (!result) return [];
    const byYear = new Map<number, (typeof result.snapshots)[0]>();
    for (const s of result.snapshots) byYear.set(s.year, s);
    return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  }, [result]);

  const preRows = useMemo(
    () =>
      allRows
        .filter((s) => s.age < targetFireAge)
        .map((s) => {
          const invested =
            s.idecoCont + s.nisaTsumCont + s.nisaGrowthCont + s.taxableCont;
          const surplus = Math.max(0, s.grossIncome - s.monthlyExpenses - s.loanPayment - invested);
          return {
            year: String(s.year),
            age: s.age,
            "Living Expenses": s.monthlyExpenses,
            "Loan Payments": s.loanPayment,
            iDeCo: s.idecoCont,
            "NISA Tsumitate": s.nisaTsumCont,
            "NISA Growth": s.nisaGrowthCont,
            "Taxable Brokerage": s.taxableCont,
            "Surplus / Buffer": surplus,
            total: s.grossIncome,
          };
        }),
    [allRows, targetFireAge]
  );

  const postRows = useMemo(
    () =>
      allRows
        .filter((s) => s.age >= targetFireAge)
        .map((s) => ({
          year: String(s.year),
          age: s.age,
          "SWP Income": s.swpWithdrawal,
          "Side Income": s.postFireSideIncome,
          "Living Expenses": s.monthlyExpenses,
          "Loan Payments": s.loanPayment,
        })),
    [allRows, targetFireAge]
  );

  if (!result) {
    return (
      <div
        style={{
          border: "1px solid var(--ink)",
          padding: 28,
          textAlign: "center",
          fontFamily: "'Lora', Georgia, serif",
          fontStyle: "italic",
          color: "var(--n500)",
          fontSize: 13,
        }}
      >
        Enter details in the sidebar to see your monthly cash flow breakdown.
      </div>
    );
  }

  // Last pre-fire row for savings rate card
  const lastPre = preRows[preRows.length - 1];
  const peakSalary = lastPre ? lastPre.total : 0;
  const peakSaved = lastPre
    ? lastPre.iDeCo +
      lastPre["NISA Tsumitate"] +
      lastPre["NISA Growth"] +
      lastPre["Taxable Brokerage"]
    : 0;
  const savingsRateStr =
    peakSalary > 0 ? `${((peakSaved / peakSalary) * 100).toFixed(0)}%` : "—";

  // Peak loan payment
  const peakLoanPayment = Math.max(...allRows.map(s => s.loanPayment), 0);

  return (
    <>
      {/* ── Page header ── */}
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
        <span>Monthly Cash Flow</span>
        <span style={{ fontSize: 9, letterSpacing: "0.12em" }}>
          Where does each yen go?
        </span>
      </div>

      {/* ── Summary chips ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "SWP Monthly Income",
            value: formatYen(result.swpMonthlyAtFire),
            color: C.swp,
          },
          {
            label: "Peak Savings Rate",
            value: savingsRateStr,
            color: C.nisaG,
          },
          {
            label: "Peak Salary / mo",
            value: peakSalary > 0 ? formatYen(peakSalary) : "—",
            color: C.ideco,
          },
          ...(peakLoanPayment > 0 ? [{
            label: "Peak Loan Payment / mo",
            value: formatYen(peakLoanPayment),
            color: C.loans,
          }] : []),
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              padding: "12px 18px",
              border: `2px solid ${color}`,
              background: "var(--paper)",
              flex: "1 1 160px",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--n500)",
                marginBottom: 5,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 700,
                color,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Accumulation Phase chart ── */}
      <div style={{ marginBottom: 36 }}>
        <SectionTitle>Accumulation Phase — Where Your Salary Goes</SectionTitle>
        <div
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 12,
            fontStyle: "italic",
            color: "var(--n500)",
            marginBottom: 14,
            marginTop: 4,
          }}
        >
          Monthly income allocation per year (December snapshot). Each bar = gross salary split by destination.
        </div>
        {preRows.length === 0 ? (
          <div
            style={{
              color: "var(--n500)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              padding: 16,
            }}
          >
            No accumulation phase data (retirement age may be set to current age).
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={preRows}
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--muted)"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fill: "var(--n500)",
                }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={yFmt}
                tick={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fill: "var(--n500)",
                }}
                tickLine={false}
                axisLine={false}
                width={62}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              />
              <Bar
                dataKey="Living Expenses"
                stackId="a"
                fill={C.expenses}
              />
              <Bar
                dataKey="Loan Payments"
                stackId="a"
                fill={C.loans}
              />
              <Bar dataKey="iDeCo" stackId="a" fill={C.ideco} />
              <Bar dataKey="NISA Tsumitate" stackId="a" fill={C.nisaT} />
              <Bar dataKey="NISA Growth" stackId="a" fill={C.nisaG} />
              <Bar
                dataKey="Taxable Brokerage"
                stackId="a"
                fill={C.taxable}
              />
              <Bar
                dataKey="Surplus / Buffer"
                stackId="a"
                fill={C.surplus}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Retirement Phase chart ── */}
      <div style={{ marginBottom: 36 }}>
        <SectionTitle>Retirement Phase — Income vs Expenses</SectionTitle>
        <div
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 12,
            fontStyle: "italic",
            color: "var(--n500)",
            marginBottom: 14,
            marginTop: 4,
          }}
        >
          Monthly cash flow during retirement. SWP draws your portfolio to ¥0 at your chosen depletion age. Side income shown separately.
        </div>
        {postRows.length === 0 ? (
          <div
            style={{
              color: "var(--n500)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              padding: 16,
            }}
          >
            No retirement phase data yet. Adjust your retirement age in the sidebar.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={postRows}
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--muted)"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fill: "var(--n500)",
                }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={yFmt}
                tick={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fill: "var(--n500)",
                }}
                tickLine={false}
                axisLine={false}
                width={62}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              />
              <ReferenceLine y={0} stroke="var(--ink)" strokeWidth={1} />
              <Bar dataKey="SWP Income" stackId="b" fill={C.swp} />
              <Bar
                dataKey="Side Income"
                stackId="b"
                fill={C.sideIncome}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="Living Expenses"
                stackId="c"
                fill={C.expRet}
              />
              <Bar
                dataKey="Loan Payments"
                stackId="c"
                fill={C.loans}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Detail table ── */}
      <div style={{ marginBottom: 24 }}>
        <SectionTitle>Annual Cash Flow Detail</SectionTitle>
        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: 400,
            border: "1px solid var(--ink)",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--ink)",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                {[
                  "Year",
                  "Age",
                  "Phase",
                  "Gross Income",
                  "→ Expenses",
                  "→ Loans",
                  "→ iDeCo",
                  "→ NISA-T",
                  "→ NISA-G",
                  "→ Taxable",
                  "SWP / Side",
                  "Net ±",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "7px 12px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: "0.12em",
                      fontSize: 8.5,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allRows.map((s) => {
                const isRetired = s.age >= targetFireAge;
                const invested =
                  s.idecoCont +
                  s.nisaTsumCont +
                  s.nisaGrowthCont +
                  s.taxableCont;
                const netDelta = isRetired
                  ? s.swpWithdrawal + s.postFireSideIncome - s.monthlyExpenses - s.loanPayment
                  : s.grossIncome - s.monthlyExpenses - s.loanPayment - invested;

                return (
                  <tr
                    key={s.year}
                    style={{
                      background: isRetired ? "#FFF8F2" : undefined,
                      borderTop:
                        s.age === targetFireAge
                          ? "2px solid #CC6600"
                          : undefined,
                    }}
                  >
                    <td style={tdStyle}>{s.year}</td>
                    <td style={tdStyle}>{s.age}</td>
                    <td
                      style={{
                        ...tdStyle,
                        color: isRetired ? C.swp : "var(--n500)",
                        fontWeight: isRetired ? 600 : 400,
                      }}
                    >
                      {isRetired ? "RETIRED" : "Working"}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {isRetired ? "—" : formatYen(s.grossIncome)}
                    </td>
                    <td style={{ ...tdStyle, color: C.expenses }}>
                      {formatYen(s.monthlyExpenses)}
                    </td>
                    <td style={{ ...tdStyle, color: C.loans }}>
                      {s.loanPayment > 0 ? formatYen(s.loanPayment) : "—"}
                    </td>
                    <td style={{ ...tdStyle, color: C.ideco }}>
                      {s.idecoCont > 0 ? formatYen(s.idecoCont) : "—"}
                    </td>
                    <td style={{ ...tdStyle, color: C.nisaT }}>
                      {s.nisaTsumCont > 0 ? formatYen(s.nisaTsumCont) : "—"}
                    </td>
                    <td style={{ ...tdStyle, color: C.nisaG }}>
                      {s.nisaGrowthCont > 0
                        ? formatYen(s.nisaGrowthCont)
                        : "—"}
                    </td>
                    <td style={{ ...tdStyle, color: C.taxable }}>
                      {s.taxableCont > 0 ? formatYen(s.taxableCont) : "—"}
                    </td>
                    <td style={{ ...tdStyle, color: C.swp }}>
                      {isRetired
                        ? formatYen(s.swpWithdrawal + s.postFireSideIncome)
                        : "—"}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: netDelta >= 0 ? "#2a7a2a" : C.expenses,
                        fontWeight: 600,
                      }}
                    >
                      {netDelta >= 0 ? "+" : ""}
                      {formatYen(netDelta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology note */}
      <div
        style={{
          marginTop: 8,
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
          All figures are December snapshot monthly values. NISA/taxable contribution estimates are derived from available disposable income after expenses and iDeCo.
          SWP is a fixed monthly draw sized to deplete the portfolio to ¥0 at your chosen depletion age — lower depletion age = higher monthly income.
          Side income is additional post-retirement income set in Advanced Options.
        </p>
      </div>
    </>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "7px 12px",
  textAlign: "right",
  color: "var(--n600)",
  whiteSpace: "nowrap",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  borderTop: "1px solid var(--muted)",
};
