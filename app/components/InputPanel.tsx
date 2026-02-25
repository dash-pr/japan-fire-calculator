"use client";

import React, { useState, useRef } from "react";
import { FutureExpense, AccountToggles, NISA_FUNDS, IDeCoType } from "@/lib/fireCalculator";
import { formatYen } from "@/lib/fireCalculator";
import { X as XIcon, ChevronDown, ChevronUp } from "lucide-react";

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
    // SWP depletion age
    swpDepletionAge: number;
    onSwpDepletionAge: (v: number) => void;
    // Advanced
    postFireMonthlyIncome: number;
    onPostFireMonthlyIncome: (v: number) => void;
    lifestyleInflation: number;
    onLifestyleInflation: (v: number) => void;
    postFatfireMonthlyIncome: number;
    onPostFatfireMonthlyIncome: (v: number) => void;
    // Future expenses
    futureExpenses: FutureExpense[];
    onFutureExpenses: (v: FutureExpense[]) => void;
}

/* ─── Info tooltip ──────────────────────────────────────────────────────────────────────────── */
function InfoTooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);
    const _ref = useRef<HTMLSpanElement>(null);
    return (
        <span
            ref={_ref}
            style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 5, cursor: "help", verticalAlign: "middle" }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 13, height: 13, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.28)",
                fontSize: 8, fontFamily: "serif", fontStyle: "italic",
                color: "rgba(255,255,255,0.38)", lineHeight: 1, userSelect: "none" as const,
            }}>i</span>
            {show && (
                <div style={{
                    position: "absolute", left: "100%", top: "50%", transform: "translateY(-50%)",
                    marginLeft: 7, background: "#1c1c1c",
                    border: "1px solid rgba(255,255,255,0.14)",
                    padding: "8px 11px", width: 190, zIndex: 200, pointerEvents: "none",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}>
                    <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 10.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.55, display: "block" }}>
                        {text}
                    </span>
                </div>
            )}
        </span>
    );
}

/* ─── Slider + click-to-type value ─────────────────────────────────────────────────────────── */
function SliderField({
    label, value, onChange, min, max, step, format, info,
}: {
    label: string; value: number; onChange: (v: number) => void;
    min: number; max: number; step: number;
    format?: (v: number) => string; info?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const display = format ? format(value) : String(value);

    const commit = (raw: string) => {
        const n = parseFloat(raw);
        if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        setEditing(false);
    };

    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", textTransform: "uppercase" as const,
                    color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center",
                }}>
                    {label}{info && <InfoTooltip text={info} />}
                </label>
                {editing ? (
                    <input
                        type="number" autoFocus value={draft}
                        min={min} max={max} step={step}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={(e) => commit(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                            if (e.key === "Escape") setEditing(false);
                        }}
                        style={{
                            width: 64, padding: "1px 4px", background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(204,0,0,0.6)", color: "#CC0000",
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                            fontWeight: 700, outline: "none", textAlign: "right" as const,
                        }}
                    />
                ) : (
                    <span
                        title="Click to type a value"
                        onClick={() => { setDraft(String(value)); setEditing(true); }}
                        style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                            fontWeight: 700, color: "#CC0000", letterSpacing: "0.02em",
                            cursor: "text", borderBottom: "1px dashed rgba(204,0,0,0.35)", lineHeight: 1,
                        }}
                    >
                        {display}
                    </span>
                )}
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(Number(e.target.value))} />
        </div>
    );
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
function Field({ label, info, children }: { label: string; info?: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label
                style={{
                    display: "flex",
                    alignItems: "center",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 5,
                }}
            >
                {label}{info && <InfoTooltip text={info} />}
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
    swpDepletionAge,
    onSwpDepletionAge,
    postFireMonthlyIncome,
    onPostFireMonthlyIncome,
    lifestyleInflation,
    onLifestyleInflation,
    postFatfireMonthlyIncome,
    onPostFatfireMonthlyIncome,
    futureExpenses,
    onFutureExpenses,
}: Props) {
    const [showFunds, setShowFunds] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
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

    const fmtPct = (v: number) => `${v}%`;
    const fmtAge = (v: number) => `age\u00a0${v}`;

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
            <SliderField
                label="Current Age" value={currentAge} onChange={onCurrentAge}
                min={18} max={70} step={1} format={fmtAge}
                info="Your age today. The simulation starts from this point."
            />
            <SliderField
                label="Retirement Age" value={targetFireAge}
                onChange={(v) => onTargetFireAge(Math.max(currentAge + 1, v))}
                min={currentAge + 1} max={80} step={1} format={fmtAge}
                info="Target age to stop working and start drawing down your portfolio (FIRE date)."
            />
            <SliderField
                label="Portfolio Depletes at" value={swpDepletionAge}
                onChange={(v) => onSwpDepletionAge(Math.max(targetFireAge + 1, v))}
                min={targetFireAge + 1} max={100} step={1} format={fmtAge}
                info="SWP is sized so your portfolio reaches exactly ¥0 at this age. Lower age = higher monthly income. Default 90."
            />

            {/* ── Income & Expenses ── */}
            <SectionHeader title="Income & Expenses" />
            <Field label="Monthly Income" info="Current gross salary per month. Grows at your salary growth rate each year.">
                <NumberInput value={monthlyIncome} onChange={onMonthlyIncome} step={10000} prefix="¥" />
            </Field>
            <Field label="Working Monthly Expenses" info="Living costs while you are still working. Grows with inflation.">
                <NumberInput value={monthlyExpenses} onChange={onMonthlyExpenses} step={10000} prefix="¥" />
            </Field>
            <Field label="Post-FIRE Monthly Budget" info="Expected monthly spending in retirement, in today's yen. Adjusted for inflation at retirement date.">
                <NumberInput value={postFireMonthlyExpenses} onChange={onPostFireMonthlyExpenses} step={10000} prefix="¥" />
            </Field>

            <SliderField
                label="Salary Growth / yr" value={salaryIncreaseRate}
                onChange={onSalaryIncreaseRate}
                min={0} max={10} step={0.5} format={fmtPct}
                info="Annual % salary increase. Boosts future savings capacity."
            />
            <SliderField
                label="Annual Inflation" value={annualInflation}
                onChange={onAnnualInflation}
                min={0} max={8} step={0.25} format={fmtPct}
                info="Expected price inflation. Erodes purchasing power and grows post-FIRE expenses."
            />

            {/* ── Investment Return ── */}
            <SectionHeader title="Investment Return" />
            <SliderField
                label="Expected Annual Return" value={annualReturn}
                onChange={onAnnualReturn}
                min={1} max={15} step={0.5} format={fmtPct}
                info="Nominal annual return before inflation. E.g., 6% input with 2% inflation = ~4% real return. Use fund picker to auto-fill."
            />

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

            {/* ── Advanced Options (collapsible) ── */}
            <button
                onClick={() => setShowAdvanced((s) => !s)}
                style={{
                    width: "100%", padding: "9px 0 8px",
                    background: "transparent", border: "none",
                    borderTop: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.22em",
                    textTransform: "uppercase", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: 8, marginBottom: showAdvanced ? 12 : 8,
                }}
            >
                Advanced Options
                {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showAdvanced && (
                <div style={{ marginBottom: 4 }}>
                    <Field
                        label="Post-FIRE Side Income / mo"
                        info="Monthly income during retirement (pension, part-time, rental). In today's yen."
                    >
                        <NumberInput value={postFireMonthlyIncome} onChange={onPostFireMonthlyIncome} step={10000} prefix="¥" min={0} />
                    </Field>
                    <SliderField
                        label="Lifestyle Inflation / yr"
                        value={lifestyleInflation}
                        onChange={onLifestyleInflation}
                        min={0}
                        max={8}
                        step={0.25}
                        format={fmtPct}
                        info="Annual increase in post-fire expenses beyond inflation. E.g., traveling more as you retire."
                    />
                    <Field
                        label="Post-FATFIRE Side Income / mo"
                        info="Additional monthly income that kicks in after you reach Fat FIRE. In today's yen."
                    >
                        <NumberInput value={postFatfireMonthlyIncome} onChange={onPostFatfireMonthlyIncome} step={10000} prefix="¥" min={0} />
                    </Field>
                </div>
            )}

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
