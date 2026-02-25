"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  runSimulation,
  SimulationInput,
  SimulationResult,
  FutureExpense,
  AccountToggles,
  IDeCoType,
} from "@/lib/fireCalculator";

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_INPUT: SimulationInput = {
  currentAge: 30,
  targetFireAge: 50,
  currentMonthlyIncome: 500_000,
  monthlyExpenses: 250_000,
  postFireMonthlyExpenses: 200_000,
  postFireMonthlyIncome: 0,
  lifestyleInflation: 0,
  postFatfireMonthlyIncome: 0,
  salaryIncreaseRate: 3,
  annualInflation: 2,
  futureExpenses: [],
  accounts: {
    idecoEnabled: true,
    nisaEnabled: true,
    taxableEnabled: true,
    juniorNisaEnabled: false,
  },
  idecoType: "freelancer",
  juniorNisaBalance: 0,
  annualReturn: 6,
  swpDepletionAge: 90,
};

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Context type ──────────────────────────────────────────────────────────────
export interface SimulatorContextValue {
  currentAge: number;
  setCurrentAge: (v: number) => void;
  targetFireAge: number;
  setTargetFireAge: (v: number) => void;
  monthlyIncome: number;
  setMonthlyIncome: (v: number) => void;
  monthlyExpenses: number;
  setMonthlyExpenses: (v: number) => void;
  postFireMonthlyExpenses: number;
  setPostFireMonthlyExpenses: (v: number) => void;
  postFireMonthlyIncome: number;
  setPostFireMonthlyIncome: (v: number) => void;
  lifestyleInflation: number;
  setLifestyleInflation: (v: number) => void;
  postFatfireMonthlyIncome: number;
  setPostFatfireMonthlyIncome: (v: number) => void;
  salaryIncreaseRate: number;
  setSalaryIncreaseRate: (v: number) => void;
  annualInflation: number;
  setAnnualInflation: (v: number) => void;
  accounts: AccountToggles;
  setAccounts: (v: AccountToggles) => void;
  idecoType: IDeCoType;
  setIdecoType: (v: IDeCoType) => void;
  annualReturn: number;
  setAnnualReturn: (v: number) => void;
  futureExpenses: FutureExpense[];
  setFutureExpenses: (v: FutureExpense[]) => void;
  juniorNisaBalance: number;
  setJuniorNisaBalance: (v: number) => void;
  swpDepletionAge: number;
  setSwpDepletionAge: (v: number) => void;
  result: SimulationResult | null;
  currentYear: number;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function SimulatorProvider({ children }: { children: React.ReactNode }) {
  const [currentAge, setCurrentAge] = useState(DEFAULT_INPUT.currentAge);
  const [targetFireAge, setTargetFireAge] = useState(DEFAULT_INPUT.targetFireAge);
  const [monthlyIncome, setMonthlyIncome] = useState(DEFAULT_INPUT.currentMonthlyIncome);
  const [monthlyExpenses, setMonthlyExpenses] = useState(DEFAULT_INPUT.monthlyExpenses);
  const [postFireMonthlyExpenses, setPostFireMonthlyExpenses] = useState(DEFAULT_INPUT.postFireMonthlyExpenses);
  const [postFireMonthlyIncome, setPostFireMonthlyIncome] = useState(DEFAULT_INPUT.postFireMonthlyIncome ?? 0);
  const [lifestyleInflation, setLifestyleInflation] = useState(DEFAULT_INPUT.lifestyleInflation);
  const [postFatfireMonthlyIncome, setPostFatfireMonthlyIncome] = useState(DEFAULT_INPUT.postFatfireMonthlyIncome ?? 0);
  const [salaryIncreaseRate, setSalaryIncreaseRate] = useState(DEFAULT_INPUT.salaryIncreaseRate);
  const [annualInflation, setAnnualInflation] = useState(DEFAULT_INPUT.annualInflation);
  const [accounts, setAccounts] = useState<AccountToggles>(DEFAULT_INPUT.accounts);
  const [idecoType, setIdecoType] = useState<IDeCoType>(DEFAULT_INPUT.idecoType);
  const [annualReturn, setAnnualReturn] = useState(DEFAULT_INPUT.annualReturn);
  const [futureExpenses, setFutureExpenses] = useState<FutureExpense[]>([]);
  const [juniorNisaBalance, setJuniorNisaBalance] = useState(DEFAULT_INPUT.juniorNisaBalance);
  const [swpDepletionAge, setSwpDepletionAge] = useState(DEFAULT_INPUT.swpDepletionAge ?? 90);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const input: SimulationInput = {
    currentAge,
    targetFireAge,
    currentMonthlyIncome: monthlyIncome,
    monthlyExpenses,
    postFireMonthlyExpenses,
    postFireMonthlyIncome,
    lifestyleInflation,
    postFatfireMonthlyIncome,
    salaryIncreaseRate,
    annualInflation,
    futureExpenses,
    accounts,
    idecoType,
    juniorNisaBalance,
    annualReturn,
    swpDepletionAge,
  };

  const debouncedInput = useDebounced(input, 150);

  useEffect(() => {
    try {
      setResult(runSimulation(debouncedInput));
    } catch (e) {
      console.error("Simulation error:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debouncedInput)]);

  return (
    <SimulatorContext.Provider
      value={{
        currentAge, setCurrentAge,
        targetFireAge, setTargetFireAge,
        monthlyIncome, setMonthlyIncome,
        monthlyExpenses, setMonthlyExpenses,
        postFireMonthlyExpenses, setPostFireMonthlyExpenses,
        postFireMonthlyIncome, setPostFireMonthlyIncome,
        lifestyleInflation, setLifestyleInflation,
        postFatfireMonthlyIncome, setPostFatfireMonthlyIncome,
        salaryIncreaseRate, setSalaryIncreaseRate,
        annualInflation, setAnnualInflation,
        accounts, setAccounts,
        idecoType, setIdecoType,
        annualReturn, setAnnualReturn,
        futureExpenses, setFutureExpenses,
        juniorNisaBalance, setJuniorNisaBalance,
        swpDepletionAge, setSwpDepletionAge,
        result,
        currentYear: new Date().getFullYear(),
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator() {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error("useSimulator must be used within SimulatorProvider");
  return ctx;
}
