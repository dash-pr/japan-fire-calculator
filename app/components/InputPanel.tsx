"use client";

import React, { useState, useRef } from "react";
import { Loan, AccountToggles, NISA_FUNDS, IDeCoType } from "@/lib/fireCalculator";
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
    postFireIncomeEndAge: number;
    onPostFireIncomeEndAge: (v: number) => void;
    lifestyleInflation: number;
    onLifestyleInflation: (v: number) => void;
    postFatfireMonthlyIncome: number;
    onPostFatfireMonthlyIncome: (v: number) => void;
    postFatfireIncomeEndAge: number;
    onPostFatfireIncomeEndAge: (v: number) => void;
    pensionEnabled: boolean;
    onPensionEnabled: (v: boolean) => void;
    pensionStartAge: number;
    onPensionStartAge: (v: number) => void;
    pensionMonthlyAmount: number;
    onPensionMonthlyAmount: (v: number) => void;
    pensionInflationAdjusted: boolean;
    onPensionInflationAdjusted: (v: boolean) => void;
    // Loans & mortgages
    loans: Loan[];
    onLoans: (v: Loan[]) => void;
    // Current portfolio balances
    initialIdecoBalance: number;
    onInitialIdecoBalance: (v: number) => void;
    initialNisaTsumitateBalance: number;
    onInitialNisaTsumitateBalance: (v: number) => void;
    initialNisaGrowthBalance: number;
    onInitialNisaGrowthBalance: (v: number) => void;
    initialTaxableBalance: number;
    onInitialTaxableBalance: (v: number) => void;
    // Cash/Emergency Fund
    monthlyEmerigencySavings: number;
    onMonthlyEmerigencySavings: (v: number) => void;
    emergencyFundTarget: number;
    onEmergencyFundTarget: (v: number) => void;
    // Investment Allocation
    allocationStrategy: 'optimal' | 'prioritizeNisa' | 'prioritizeIdeco' | 'equalSplit';
    onAllocationStrategy: (v: 'optimal' | 'prioritizeNisa' | 'prioritizeIdeco' | 'equalSplit') => void;
}

/* ─── Info tooltip ──────────────────────────────────────────────────────────────────────────── */
function InfoTooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const _ref = useRef<HTMLSpanElement>(null);

    const handleMouseEnter = () => {
        if (_ref.current) {
            const rect = _ref.current.getBoundingClientRect();
            setPos({
                x: rect.right + 7,
                y: rect.top + rect.height / 2,
            });
        }
        setShow(true);
    };

    return (
        <span
            ref={_ref}
            style={{ display: "inline-flex", alignItems: "center", marginLeft: 5, cursor: "help", verticalAlign: "middle" }}
            onMouseEnter={handleMouseEnter}
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
                    position: "fixed", left: pos.x, top: pos.y, transform: "translateY(-50%)",
                    background: "#1c1c1c",
                    border: "1px solid rgba(255,255,255,0.14)",
                    padding: "8px 11px", width: 190, zIndex: 9999, pointerEvents: "none",
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
        if (!isNaN(n) && raw.trim() !== "") onChange(Math.min(max, Math.max(min, n)));
        setEditing(false);
    };

    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                    letterSpacing: "0.1em", textTransform: "uppercase" as const,
                    color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center",
                }}>
                    {label}{info && <InfoTooltip text={info} />}
                </label>
                {editing ? (
                    <input
                        type="text" inputMode="decimal" autoFocus value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={(e) => commit(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                            if (e.key === "Escape") { setEditing(false); setDraft(""); }
                        }}
                        placeholder="Enter value"
                        style={{
                            width: 64, padding: "1px 4px", background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(204,0,0,0.6)", color: "#FF8C00",
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
                            fontWeight: 700, color: "#FF8C00", letterSpacing: "0.02em",
                            cursor: "text", borderBottom: "1px dashed rgba(204,0,0,0.35)", lineHeight: 1,
                            userSelect: "text",
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
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.75)",
                }}
            >
                {title}
            </span>
        </div>
    );
}

/* ─── Collapsible Section ─── */
function CollapsibleSection({
    title,
    isOpen,
    onToggle,
    children,
}: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div>
            <button
                onClick={onToggle}
                style={{
                    width: "100%",
                    padding: "10px 0 9px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.75)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 8,
                    marginBottom: isOpen ? 12 : 8,
                }}
            >
                {title}
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {isOpen && <div style={{ marginBottom: 4 }}>{children}</div>}
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
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.75)",
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
                        color: "rgba(255,255,255,0.7)",
                        pointerEvents: "none",
                    }}
                >
                    {prefix}
                </span>
            )}
            <input
                type="number"
                value={value === 0 ? "" : value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder="0"
                style={{
                    paddingLeft: prefix ? 18 : 4,
                    paddingRight: suffix ? 26 : 4,
                }}
            />
            {suffix && (
                <span
                    style={{
                        position: "absolute",
                        right: 4,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.7)",
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
                style={{ accentColor: checked ? "#FF8C00" : "#F9F9F7" }}
            />
            <span
                style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
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
    postFireIncomeEndAge,
    onPostFireIncomeEndAge,
    lifestyleInflation,
    onLifestyleInflation,
    postFatfireMonthlyIncome,
    onPostFatfireMonthlyIncome,
    postFatfireIncomeEndAge,
    onPostFatfireIncomeEndAge,
    pensionEnabled,
    onPensionEnabled,
    pensionStartAge,
    onPensionStartAge,
    pensionMonthlyAmount,
    onPensionMonthlyAmount,
    pensionInflationAdjusted,
    onPensionInflationAdjusted,
    loans,
    onLoans,
    initialIdecoBalance,
    onInitialIdecoBalance,
    initialNisaTsumitateBalance,
    onInitialNisaTsumitateBalance,
    initialNisaGrowthBalance,
    onInitialNisaGrowthBalance,
    initialTaxableBalance,
    onInitialTaxableBalance,
    monthlyEmerigencySavings,
    onMonthlyEmerigencySavings,
    emergencyFundTarget,
    onEmergencyFundTarget,
    allocationStrategy,
    onAllocationStrategy,
}: Props) {
    const [showFunds, setShowFunds] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showIncomeExpenses, setShowIncomeExpenses] = useState(false);
    const [showInvestment, setShowInvestment] = useState(false);
    const [showAccounts, setShowAccounts] = useState(false);
    const [showPortfolio, setShowPortfolio] = useState(false);
    const [showLoans, setShowLoans] = useState(false);
    const [showInvestmentAllocation, setShowInvestmentAllocation] = useState(false);
    const [newLoan, setNewLoan] = useState({ label: "Mortgage", principal: 25_000_000, annualInterestRate: 2.5, remainingMonths: 360, startAge: currentAge });

    const addLoan = () => {
        if (!newLoan.label.trim() || newLoan.principal <= 0 || newLoan.remainingMonths <= 0) return;
        onLoans([
            ...loans,
            { ...newLoan, id: String(Date.now()) },
        ]);
        setNewLoan({ label: "Mortgage", principal: 25_000_000, annualInterestRate: 2.5, remainingMonths: 360, startAge: currentAge });
    };

    const removeLoan = (id: string) =>
        onLoans(loans.filter((l) => l.id !== id));

    const fmtPct = (v: number) => `${v}%`;
    const fmtAge = (v: number) => `${v}`;

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
            <CollapsibleSection title="Profile" isOpen={showProfile} onToggle={() => setShowProfile(!showProfile)}>
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
            </CollapsibleSection>

            {/* ── Income & Expenses ── */}
            <CollapsibleSection title="Income & Expenses" isOpen={showIncomeExpenses} onToggle={() => setShowIncomeExpenses(!showIncomeExpenses)}>
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
            </CollapsibleSection>

            {/* ── Investment Return ── */}
            <CollapsibleSection title="Investment Return" isOpen={showInvestment} onToggle={() => setShowInvestment(!showInvestment)}>
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
                        fontSize: 12,
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
            </CollapsibleSection>

            {/* ── Accounts ── */}
            <CollapsibleSection title="Account Types" isOpen={showAccounts} onToggle={() => setShowAccounts(!showAccounts)}>
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
                                        background: active ? "rgba(255,140,0,0.18)" : "rgba(255,255,255,0.05)",
                                        border: `1px solid ${active ? "#FF8C00" : "rgba(255,255,255,0.12)"}`,
                                        color: active ? "#FF8C00" : "rgba(255,255,255,0.45)",
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 12,
                                        fontWeight: active ? 700 : 400,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        cursor: "pointer",
                                        transition: "all 0.12s",
                                    }}
                                >
                                    {type === "freelancer" ? "Freelancer" : "Employee"}<br />
                                    <span style={{ fontSize: 13, opacity: 0.7 }}>{cap}/mo</span>
                                </button>
                            );
                        })}
                    </div>
                )}
                <Toggle
                    label="NISA Tsumitate — ¥6M lifetime (¥100k/mo)"
                    checked={accounts.nisaTsumitateEnabled}
                    onChange={(v) => onAccounts({ ...accounts, nisaTsumitateEnabled: v })}
                />
                <Toggle
                    label="NISA Growth — ¥12M lifetime (¥200k/mo)"
                    checked={accounts.nisaGrowthEnabled}
                    onChange={(v) => onAccounts({ ...accounts, nisaGrowthEnabled: v })}
                />
                <Toggle
                    label="Taxable Brokerage"
                    checked={accounts.taxableEnabled}
                    onChange={(v) => onAccounts({ ...accounts, taxableEnabled: v })}
                />
            </CollapsibleSection>

            {/* ── Advanced Options (collapsible) ── */}
            <button
                onClick={() => setShowAdvanced((s) => !s)}
                style={{
                    width: "100%", padding: "9px 0 8px",
                    background: "transparent", border: "none",
                    borderTop: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.75)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13, fontWeight: 700, letterSpacing: "0.22em",
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
                    {/* ── Pension / Social Security Section ── */}
                    <div
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            padding: "12px 12px",
                            marginBottom: 12,
                            borderRadius: "2px",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.75)",
                                marginBottom: 10,
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={pensionEnabled}
                                onChange={(e) => onPensionEnabled(e.target.checked)}
                                style={{ accentColor: pensionEnabled ? "#FF8C00" : "#F9F9F7", cursor: "pointer" }}
                            />
                            <label
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: pensionEnabled ? "#F9F9F7" : "rgba(255,255,255,0.5)",
                                    cursor: "pointer",
                                    flex: 1,
                                }}
                            >
                                Pension / Social Security
                            </label>
                        </div>
                        {pensionEnabled && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <SliderField
                                    label="Start Age"
                                    value={pensionStartAge}
                                    onChange={onPensionStartAge}
                                    min={55}
                                    max={75}
                                    step={1}
                                    info="Age when pension income begins"
                                />
                                <Field label="Monthly Amount">
                                    <NumberInput value={pensionMonthlyAmount} onChange={onPensionMonthlyAmount} step={10000} prefix="¥" min={0} />
                                </Field>
                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        cursor: "pointer",
                                        padding: "6px 8px",
                                        background: "rgba(255,255,255,0.02)",
                                        borderRadius: "1px",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={pensionInflationAdjusted}
                                        onChange={(e) => onPensionInflationAdjusted(e.target.checked)}
                                        style={{ accentColor: pensionInflationAdjusted ? "#FF8C00" : "#F9F9F7", cursor: "pointer" }}
                                    />
                                    <span
                                        style={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: 13,
                                            color: "rgba(255,255,255,0.6)",
                                            letterSpacing: "0.06em",
                                        }}
                                    >
                                        Adjust for inflation
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, alignItems: "flex-end" }}>
                        <div>
                            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", display: "block", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Post-FIRE Side Income / mo</label>
                            <NumberInput value={postFireMonthlyIncome} onChange={onPostFireMonthlyIncome} step={10000} prefix="¥" min={0} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", display: "block", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Ends at Age</label>
                            <NumberInput value={postFireIncomeEndAge} onChange={onPostFireIncomeEndAge} step={1} min={0} max={90} />
                        </div>
                    </div>
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, alignItems: "flex-end" }}>
                        <div>
                            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", display: "block", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Post-FATFIRE Side Income / mo</label>
                            <NumberInput value={postFatfireMonthlyIncome} onChange={onPostFatfireMonthlyIncome} step={10000} prefix="¥" min={0} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", display: "block", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Ends at Age</label>
                            <NumberInput value={postFatfireIncomeEndAge} onChange={onPostFatfireIncomeEndAge} step={1} min={0} max={120} />
                        </div>
                    </div>

                    {/* ── Cash / Emergency Fund Section ── */}
                    <div
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            padding: "12px 12px",
                            marginBottom: 12,
                            borderRadius: "2px",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.75)",
                                marginBottom: 10,
                            }}
                        >
                            Cash / Emergency Fund
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div>
                                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", display: "block", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Save per month</label>
                                <NumberInput value={monthlyEmerigencySavings} onChange={onMonthlyEmerigencySavings} step={10000} prefix="¥" min={0} />
                            </div>
                            <div>
                                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", display: "block", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Target amount</label>
                                <NumberInput value={emergencyFundTarget} onChange={onEmergencyFundTarget} step={100000} prefix="¥" min={0} />
                            </div>
                        </div>
                    </div>

                    {/* ── Investment Allocation Strategy ── */}
                    <div
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            padding: "12px 12px",
                            marginBottom: 12,
                            borderRadius: "2px",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.75)",
                                marginBottom: 10,
                            }}
                        >
                            Investment Allocation Strategy
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                <input
                                    type="radio"
                                    name="allocation"
                                    checked={allocationStrategy === "optimal"}
                                    onChange={() => onAllocationStrategy("optimal")}
                                    style={{ accentColor: "#FF8C00", cursor: "pointer" }}
                                />
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Optimal — Maximize tax efficiency</span>
                            </label>
                            {(accounts.idecoEnabled || accounts.nisaTsumitateEnabled || accounts.nisaGrowthEnabled) && (
                                <>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                        <input
                                            type="radio"
                                            name="allocation"
                                            checked={allocationStrategy === "prioritizeNisa"}
                                            onChange={() => onAllocationStrategy("prioritizeNisa")}
                                            style={{ accentColor: "#FF8C00", cursor: "pointer" }}
                                        />
                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Prioritize NISA — Fill NISA first</span>
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                        <input
                                            type="radio"
                                            name="allocation"
                                            checked={allocationStrategy === "prioritizeIdeco"}
                                            onChange={() => onAllocationStrategy("prioritizeIdeco")}
                                            style={{ accentColor: "#FF8C00", cursor: "pointer" }}
                                        />
                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Prioritize iDeCo — Fill iDeCo first</span>
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                        <input
                                            type="radio"
                                            name="allocation"
                                            checked={allocationStrategy === "equalSplit"}
                                            onChange={() => onAllocationStrategy("equalSplit")}
                                            style={{ accentColor: "#FF8C00", cursor: "pointer" }}
                                        />
                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Equal Split — Divide equally</span>
                                    </label>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Current Portfolio Balances ── */}
            <CollapsibleSection title="Current Portfolio (optional)" isOpen={showPortfolio} onToggle={() => setShowPortfolio(!showPortfolio)}>
                <Field
                    label="iDeCo Balance"
                    info="Your current iDeCo account balance in yen. Leave at 0 if you don't have an existing balance."
                >
                    <NumberInput value={initialIdecoBalance} onChange={onInitialIdecoBalance} step={100000} prefix="¥" min={0} />
                </Field>
                <Field
                    label="NISA Tsumitate Balance"
                    info="Current balance in your NISA tsumitate (積立投資枠) account."
                >
                    <NumberInput value={initialNisaTsumitateBalance} onChange={onInitialNisaTsumitateBalance} step={100000} prefix="¥" min={0} />
                </Field>
                <Field
                    label="NISA Growth Balance"
                    info="Current balance in your NISA growth (成長投資枠) account."
                >
                    <NumberInput value={initialNisaGrowthBalance} onChange={onInitialNisaGrowthBalance} step={100000} prefix="¥" min={0} />
                </Field>
                <Field
                    label="Taxable Brokerage Balance"
                    info="Current balance in your taxable brokerage account."
                >
                    <NumberInput value={initialTaxableBalance} onChange={onInitialTaxableBalance} step={100000} prefix="¥" min={0} />
                </Field>
            </CollapsibleSection>

            {/* ── Loans & Mortgages ── */}
            <CollapsibleSection title="Loans & Mortgages (optional)" isOpen={showLoans} onToggle={() => setShowLoans(!showLoans)}>
                {/* Existing loans */}
                {loans.map((loan) => {
                    const monthlyPayment = loan.remainingMonths > 0
                        ? (loan.principal * ((loan.annualInterestRate / 100 / 12) * Math.pow(1 + loan.annualInterestRate / 100 / 12, loan.remainingMonths))) / (Math.pow(1 + loan.annualInterestRate / 100 / 12, loan.remainingMonths) - 1)
                        : 0;
                    const yearsRemaining = Math.ceil(loan.remainingMonths / 12);
                    return (
                        <div
                            key={loan.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                padding: "8px 10px",
                                marginBottom: 8,
                                gap: 8,
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 13,
                                        color: "#F9F9F7",
                                        fontWeight: 500,
                                        marginBottom: 2,
                                    }}
                                >
                                    {loan.label}
                                </div>
                                <div
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 13,
                                        color: "rgba(255,255,255,0.75)",
                                    }}
                                >
                                    {formatYen(loan.principal)} · {loan.annualInterestRate}% · {yearsRemaining}yr{loan.startAge && loan.startAge > currentAge ? ` · from age ${loan.startAge}` : ""} (~{formatYen(Math.round(monthlyPayment))}/mo)
                                </div>
                            </div>
                            <button
                                onClick={() => removeLoan(loan.id)}
                                aria-label={`Remove ${loan.label}`}
                                style={{
                                    background: "none",
                                    border: "none",
                                    padding: "2px",
                                    cursor: "pointer",
                                    color: "#FF8C00",
                                    display: "flex",
                                    alignItems: "center",
                                    minWidth: 20,
                                    minHeight: 20,
                                }}
                            >
                                <XIcon size={12} strokeWidth={2} />
                            </button>
                        </div>
                    );
                })}

                {/* Add new loan form */}
                <div
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        marginBottom: 24,
                    }}
                >
                    <input
                        type="text"
                        placeholder="Label (e.g. Mortgage, Car Loan)"
                        value={newLoan.label}
                        onChange={(e) => setNewLoan((l) => ({ ...l, label: e.target.value }))}
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <div>
                            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", display: "block", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Principal (¥)</label>
                            <NumberInput
                                value={newLoan.principal}
                                onChange={(v) => setNewLoan((l) => ({ ...l, principal: v }))}
                                min={0} step={1000000} prefix="¥"
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", display: "block", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Interest Rate (%)</label>
                            <NumberInput
                                value={newLoan.annualInterestRate}
                                onChange={(v) => setNewLoan((l) => ({ ...l, annualInterestRate: v }))}
                                min={0} max={20} step={0.1} suffix="%"
                            />
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <div>
                            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", display: "block", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Term (years)</label>
                            <NumberInput
                                value={newLoan.remainingMonths / 12}
                                onChange={(v) => setNewLoan((l) => ({ ...l, remainingMonths: Math.round(v * 12) }))}
                                min={1} max={50} step={1} suffix=" years"
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", display: "block", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Start Age</label>
                            <NumberInput
                                value={newLoan.startAge}
                                onChange={(v) => setNewLoan((l) => ({ ...l, startAge: v }))}
                                min={currentAge} max={80} step={1}
                            />
                        </div>
                    </div>
                    <button
                        onClick={addLoan}
                        style={{
                            background: "#FF8C00",
                            border: "none",
                            color: "#F9F9F7",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            fontSize: 12,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            padding: "8px",
                            cursor: "pointer",
                            transition: "background 0.15s",
                        }}
                    >
                        + Add Loan
                    </button>
                </div>
            </CollapsibleSection>
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
                            background: active ? "rgba(255,140,0,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${active ? "#FF8C00" : "rgba(255,255,255,0.1)"}`,
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
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: active ? "#FF8C00" : "#F9F9F7",
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
                                    fontSize: 13,
                                    color: "#FF8C00",
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
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                                {fund.category} · Fee: {fund.expenseRatio}%
                            </span>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                                5y avg: <span style={{ color: active ? "#FF8C00" : "rgba(255,255,255,0.7)", fontWeight: 600 }}>{fund.return5y}%</span>
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
