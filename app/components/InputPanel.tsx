"use client";

import React, { useState } from "react";
import { FutureExpense, AccountToggles, NISA_FUNDS, IDeCoType } from "@/lib/fireCalculator";
import { formatYen } from "@/lib/fireCalculator";
import { X as XIcon } from "lucide-react";

interface Props {
    // Profile
    currentAge: number;
    targetFireAge: number;
    onCurrentAge: (v: number) => void;
    onTargetFireAge: (v: number) => void;
    // Income
    monthlyIncome: number;
    monthlyExpenses: number;
    postFireMonthlyExpenses: number;
    salaryIncreaseRate: number;
    annualInflation: number;
    onMonthlyIncome: (v: number) => void;
    onMonthlyExpenses: (v: number) => void;
    onPostFireMonthlyExpenses: (v: number) => void;
    onSalaryIncreaseRate: (v: number) => void;
    onAnnualInflation: (v: number) => void;
    // Accounts
    accounts: AccountToggles;
    onAccounts: (v: AccountToggles) => void;
    idecoType: IDeCoType;
    onIdecoType: (v: IDeCoType) => void;
    juniorNisaBalance: number;
    onJuniorNisaBalance: (v: number) => void;
    // Investment
    annualReturn: number;
    onAnnualReturn: (v: number) => void;
    // Future expenses
    futureExpenses: FutureExpense[];
    onFutureExpenses: (v: FutureExpense[]) => void;
}

/* ─── Section header (inverted sidebar) ─── */
function SectionHeader({ title }: { title: string }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 0 8px",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                marginBottom: 14,
                marginTop: 8,
            }}
        >
            <span
                style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                }}
            >
                {title}
            </span>
        </div>
    );
}

/* ─── Label + children wrapper ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label
                style={{
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 5,
                }}
            >
                {label}
            </label>
            {children}
        </div>
    );
}

/* ─── Number input with optional prefix/suffix ─── */
function NumberInput({
    value,
    onChange,
    min,
    max,
    step = 1,
    prefix,
    suffix,
}: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    prefix?: string;
    suffix?: string;
}) {
    return (
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            {prefix && (
                <span
                    style={{
                        position: "absolute",
                        left: 4,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.35)",
                        pointerEvents: "none",
                    }}
                >
                    {prefix}
                </span>
            )}
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{ paddingLeft: prefix ? 18 : 4, paddingRight: suffix ? 26 : 4 }}
            />
            {suffix && (
                <span
                    style={{
                        position: "absolute",
                        right: 4,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                        pointerEvents: "none",
                    }}
                >
                    {suffix}
                </span>
            )}
        </div>
    );
}

/* ─── Account toggle (inverted style) ─── */
function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                padding: "8px 10px",
                background: checked ? "rgba(255,255,255,0.08)" : "transparent",
                border: `1px solid ${checked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"}`,
                transition: "all 0.15s",
                marginBottom: 7,
            }}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                style={{ accentColor: checked ? "#CC0000" : "#F9F9F7" }}
            />
            <span
                style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: checked ? "#F9F9F7" : "rgba(255,255,255,0.5)",
                    fontWeight: checked ? 600 : 400,
                    letterSpacing: "0.02em",
                }}
            >
                {label}
            </span>
        </label>
    );
}

let feIdCounter = 1000;

export default function InputPanel({
    currentAge,
    targetFireAge,
    onCurrentAge,
    onTargetFireAge,
    monthlyIncome,
    monthlyExpenses,
    postFireMonthlyExpenses,
    salaryIncreaseRate,
    annualInflation,
    onMonthlyIncome,
    onMonthlyExpenses,
    onPostFireMonthlyExpenses,
    onSalaryIncreaseRate,
    onAnnualInflation,
    accounts,
    onAccounts,
    idecoType,
    onIdecoType,
    juniorNisaBalance,
    onJuniorNisaBalance,
    annualReturn,
    onAnnualReturn,
    futureExpenses,
    onFutureExpenses,
}: Props) {
    const [showFunds, setShowFunds] = useState(false);
    const [newFe, setNewFe] = useState({ label: "", yearsFromNow: 5, amount: 5_000_000 });

    const addExpense = () => {
        if (!newFe.label.trim()) return;
        onFutureExpenses([
            ...futureExpenses,
            { ...newFe, id: String(feIdCounter++) },
        ]);
        setNewFe({ label: "", yearsFromNow: 5, amount: 5_000_000 });
    };

    const removeExpense = (id: string) =>
        onFutureExpenses(futureExpenses.filter((f) => f.id !== id));

    const sliderLabelStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 6,
    };
    const sliderValueStyle: React.CSSProperties = {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        fontWeight: 700,
        color: "#CC0000",
        letterSpacing: "0.02em",
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                overflowY: "auto",
                height: "100%",
            }}
        >
            {/* ── Profile ── */}
            <SectionHeader title="Profile" />
            <Field label="Current Age">
                <NumberInput value={currentAge} onChange={onCurrentAge} min={18} max={80} />
            </Field>
            <Field label="Target FIRE Age">
                <NumberInput value={targetFireAge} onChange={onTargetFireAge} min={currentAge + 1} max={80} />
            </Field>

            {/* ── Income & Expenses ── */}
            <SectionHeader title="Income & Expenses" />
            <Field label="Monthly Income">
                <NumberInput value={monthlyIncome} onChange={onMonthlyIncome} step={10000} prefix="¥" />
            </Field>
            <Field label="Working Monthly Expenses">
                <NumberInput value={monthlyExpenses} onChange={onMonthlyExpenses} step={10000} prefix="¥" />
            </Field>
            <Field label="Post-FIRE Monthly Budget">
                <NumberInput value={postFireMonthlyExpenses} onChange={onPostFireMonthlyExpenses} step={10000} prefix="¥" />
            </Field>

            {/* Salary growth slider */}
            <div style={{ marginBottom: 14 }}>
                <div style={sliderLabelStyle}>
                    <label
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.4)",
                        }}
                    >
                        Salary Growth / yr
                    </label>
                    <span style={sliderValueStyle}>{salaryIncreaseRate}%</span>
                </div>
                <input
                    type="range"
                    min={0} max={10} step={0.5}
                    value={salaryIncreaseRate}
                    onChange={(e) => onSalaryIncreaseRate(Number(e.target.value))}
                />
            </div>

            {/* Inflation slider */}
            <div style={{ marginBottom: 14 }}>
                <div style={sliderLabelStyle}>
                    <label
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.4)",
                        }}
                    >
                        Annual Inflation
                    </label>
                    <span style={sliderValueStyle}>{annualInflation}%</span>
                </div>
                <input
                    type="range"
                    min={0} max={8} step={0.25}
                    value={annualInflation}
                    onChange={(e) => onAnnualInflation(Number(e.target.value))}
                />
            </div>

            {/* ── Investment Return ── */}
            <SectionHeader title="Investment Return" />
            <div style={{ marginBottom: 10 }}>
                <div style={sliderLabelStyle}>
                    <label
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.4)",
                        }}
                    >
                        Expected Annual Return
                    </label>
                    <span style={sliderValueStyle}>{annualReturn}%</span>
                </div>
                <input
                    type="range"
                    min={1} max={15} step={0.5}
                    value={annualReturn}
                    onChange={(e) => onAnnualReturn(Number(e.target.value))}
                />
            </div>

            {/* Fund picker toggle */}
            <button
                onClick={() => setShowFunds((s) => !s)}
                style={{
                    width: "100%",
                    padding: "7px 10px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 14,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "left",
                }}
            >
                {showFunds ? "▲  Hide Fund Picker" : "▼  Browse NISA Funds"}
            </button>
            {showFunds && <FundPicker onSelect={onAnnualReturn} current={annualReturn} />}

            {/* ── Accounts ── */}
            <SectionHeader title="Account Types" />
            <Toggle
                label="iDeCo (max ¥68k/mo)"
                checked={accounts.idecoEnabled}
                onChange={(v) => onAccounts({ ...accounts, idecoEnabled: v })}
            />
            {/* iDeCo type selector */}
            {accounts.idecoEnabled && (
                <div
                    style={{
                        display: "flex",
                        gap: 6,
                        marginBottom: 10,
                        marginTop: -4,
                        paddingLeft: 2,
                    }}
                >
                    {(["freelancer", "employee"] as IDeCoType[]).map((type) => {
                        const active = idecoType === type;
                        const cap = type === "freelancer" ? "¥68k" : "¥23k";
                        return (
                            <button
                                key={type}
                                onClick={() => onIdecoType(type)}
                                style={{
                                    flex: 1,
                                    padding: "5px 6px",
                                    background: active ? "rgba(204,0,0,0.18)" : "rgba(255,255,255,0.05)",
                                    border: `1px solid ${active ? "#CC0000" : "rgba(255,255,255,0.12)"}`,
                                    color: active ? "#CC0000" : "rgba(255,255,255,0.45)",
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 10,
                                    fontWeight: active ? 700 : 400,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                    transition: "all 0.12s",
                                }}
                            >
                                {type === "freelancer" ? "Freelancer" : "Employee"}<br />
                                <span style={{ fontSize: 9, opacity: 0.7 }}>{cap}/mo</span>
                            </button>
                        );
                    })}
                </div>
            )}
            <Toggle
                label="NISA — Tsumitate ¥6M + Growth ¥12M"
                checked={accounts.nisaEnabled}
                onChange={(v) => onAccounts({ ...accounts, nisaEnabled: v })}
            />
            <Toggle
                label="Junior NISA (existing balance)"
                checked={accounts.juniorNisaEnabled}
                onChange={(v) => onAccounts({ ...accounts, juniorNisaEnabled: v })}
            />
            {/* Junior NISA balance input */}
            {accounts.juniorNisaEnabled && (
                <div style={{ marginBottom: 10, marginTop: -4, paddingLeft: 2 }}>
                    <Field label="Junior NISA Balance (today)">
                        <NumberInput
                            value={juniorNisaBalance}
                            onChange={onJuniorNisaBalance}
                            step={100000}
                            prefix="¥"
                            min={0}
                        />
                    </Field>
                </div>
            )}
            <Toggle
                label="Taxable Brokerage"
                checked={accounts.taxableEnabled}
                onChange={(v) => onAccounts({ ...accounts, taxableEnabled: v })}
            />

            {/* ── Future Expenses ── */}
            <SectionHeader title="Future Lump-Sum Expenses" />

            {/* Existing expenses */}
            {futureExpenses.map((fe) => (
                <div
                    key={fe.id}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "7px 10px",
                        marginBottom: 6,
                        gap: 8,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: "#F9F9F7",
                            fontWeight: 500,
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {fe.label}
                    </span>
                    <span
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10,
                            color: "rgba(255,255,255,0.4)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        +{fe.yearsFromNow}yr · {formatYen(fe.amount)}
                    </span>
                    <button
                        onClick={() => removeExpense(fe.id)}
                        aria-label={`Remove ${fe.label}`}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "2px",
                            cursor: "pointer",
                            color: "#CC0000",
                            display: "flex",
                            alignItems: "center",
                            minWidth: 20,
                            minHeight: 20,
                        }}
                    >
                        <XIcon size={12} strokeWidth={2} />
                    </button>
                </div>
            ))}

            {/* Add new expense form */}
            <div
                style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    marginBottom: 24,
                }}
            >
                <input
                    type="text"
                    placeholder="Label (e.g. House Purchase)"
                    value={newFe.label}
                    onChange={(e) => setNewFe((f) => ({ ...f, label: e.target.value }))}
                    style={{
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.2)",
                        color: "#F9F9F7",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        padding: "5px 4px",
                        outline: "none",
                        width: "100%",
                    }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ flex: 1 }}>
                        <NumberInput
                            value={newFe.yearsFromNow}
                            onChange={(v) => setNewFe((f) => ({ ...f, yearsFromNow: v }))}
                            min={1} max={50} suffix="yr"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <NumberInput
                            value={newFe.amount}
                            onChange={(v) => setNewFe((f) => ({ ...f, amount: v }))}
                            step={500000} prefix="¥"
                        />
                    </div>
                </div>
                <button
                    onClick={addExpense}
                    style={{
                        background: "#CC0000",
                        border: "none",
                        color: "#F9F9F7",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        padding: "8px",
                        cursor: "pointer",
                        transition: "background 0.15s",
                    }}
                >
                    + Add Expense
                </button>
            </div>
        </div>
    );
}

/* ─── NISA Fund Picker ─── */
function FundPicker({ onSelect, current }: { onSelect: (r: number) => void; current: number }) {
    return (
        <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 5 }}>
            {NISA_FUNDS.map((fund) => {
                const active = current === fund.expectedReturn;
                return (
                    <button
                        key={fund.ticker}
                        onClick={() => onSelect(fund.expectedReturn)}
                        style={{
                            background: active ? "rgba(204,0,0,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${active ? "#CC0000" : "rgba(255,255,255,0.1)"}`,
                            padding: "9px 11px",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.12s",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: active ? "#CC0000" : "#F9F9F7",
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    marginRight: 8,
                                }}
                            >
                                {fund.name}
                            </span>
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 11,
                                    color: "#CC0000",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {fund.expectedReturn}%
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                                {fund.category} · Fee: {fund.expenseRatio}%
                            </span>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                                5y avg: <span style={{ color: active ? "#CC0000" : "rgba(255,255,255,0.7)", fontWeight: 600 }}>{fund.return5y}%</span>
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
