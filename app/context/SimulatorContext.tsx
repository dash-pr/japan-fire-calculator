"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  runSimulation,
  SimulationInput,
  SimulationResult,
  Loan,
  AccountToggles,
  IDeCoType,
} from "@/lib/fireCalculator";
import { validateSimulationInput, ValidationError } from "@/lib/validation";

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_INPUT: SimulationInput = {
  currentAge: 30,
  targetFireAge: 50,
  currentMonthlyIncome: 500_000,
  monthlyExpenses: 250_000,
  postFireMonthlyExpenses: 200_000,
  postFireMonthlyIncome: 0,
  postFireIncomeEndAge: undefined,
  lifestyleInflation: 0,
  postFatfireMonthlyIncome: 0,
  postFatfireIncomeEndAge: 90,
  salaryIncreaseRate: 3,
  annualInflation: 2,
  loans: [],
  accounts: {
    idecoEnabled: true,
    nisaTsumitateEnabled: true,
    nisaGrowthEnabled: true,
    taxableEnabled: true,
    juniorNisaEnabled: false,
  },
  idecoType: "freelancer",
  juniorNisaBalance: 0,
  annualReturn: 6,
  swpDepletionAge: 90,
  initialIdecoBalance: 0,
  initialNisaTsumitateBalance: 0,
  initialNisaGrowthBalance: 0,
  initialTaxableBalance: 0,
  pensionEnabled: false,
  pensionStartAge: 65,
  pensionMonthlyAmount: 0,
  pensionInflationAdjusted: true,
};

// ── Custom Hooks ──────────────────────────────────────────────────────────────

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const item = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Failed to read localStorage key "${key}":`, error);
    }
  }, [key]);

  // Debounce writes to localStorage
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Failed to write localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
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
  postFireIncomeEndAge: number;
  setPostFireIncomeEndAge: (v: number) => void;
  lifestyleInflation: number;
  setLifestyleInflation: (v: number) => void;
  postFatfireMonthlyIncome: number;
  setPostFatfireMonthlyIncome: (v: number) => void;
  postFatfireIncomeEndAge: number;
  setPostFatfireIncomeEndAge: (v: number) => void;
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
  loans: Loan[];
  setLoans: (v: Loan[]) => void;
  juniorNisaBalance: number;
  setJuniorNisaBalance: (v: number) => void;
  swpDepletionAge: number;
  setSwpDepletionAge: (v: number) => void;
  initialIdecoBalance: number;
  setInitialIdecoBalance: (v: number) => void;
  initialNisaTsumitateBalance: number;
  setInitialNisaTsumitateBalance: (v: number) => void;
  initialNisaGrowthBalance: number;
  setInitialNisaGrowthBalance: (v: number) => void;
  initialTaxableBalance: number;
  setInitialTaxableBalance: (v: number) => void;
  pensionEnabled: boolean;
  setPensionEnabled: (v: boolean) => void;
  pensionStartAge: number;
  setPensionStartAge: (v: number) => void;
  pensionMonthlyAmount: number;
  setPensionMonthlyAmount: (v: number) => void;
  pensionInflationAdjusted: boolean;
  setPensionInflationAdjusted: (v: boolean) => void;
  result: SimulationResult | null;
  validationErrors: ValidationError[];
  simulationError: string | null;
  currentYear: number;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function SimulatorProvider({ children }: { children: React.ReactNode }) {
  // Use localStorage for persistence
  const [currentAge, setCurrentAge] = useLocalStorage(
    "fire-currentAge",
    DEFAULT_INPUT.currentAge
  );
  const [targetFireAge, setTargetFireAge] = useLocalStorage(
    "fire-targetFireAge",
    DEFAULT_INPUT.targetFireAge
  );
  const [monthlyIncome, setMonthlyIncome] = useLocalStorage(
    "fire-monthlyIncome",
    DEFAULT_INPUT.currentMonthlyIncome
  );
  const [monthlyExpenses, setMonthlyExpenses] = useLocalStorage(
    "fire-monthlyExpenses",
    DEFAULT_INPUT.monthlyExpenses
  );
  const [postFireMonthlyExpenses, setPostFireMonthlyExpenses] = useLocalStorage(
    "fire-postFireMonthlyExpenses",
    DEFAULT_INPUT.postFireMonthlyExpenses
  );
  const [postFireMonthlyIncome, setPostFireMonthlyIncome] = useLocalStorage(
    "fire-postFireMonthlyIncome",
    DEFAULT_INPUT.postFireMonthlyIncome ?? 0
  );
  const [postFireIncomeEndAge, setPostFireIncomeEndAge] = useLocalStorage(
    "fire-postFireIncomeEndAge",
    DEFAULT_INPUT.postFireIncomeEndAge ?? 65
  );
  const [lifestyleInflation, setLifestyleInflation] = useLocalStorage(
    "fire-lifestyleInflation",
    DEFAULT_INPUT.lifestyleInflation
  );
  const [postFatfireMonthlyIncome, setPostFatfireMonthlyIncome] = useLocalStorage(
    "fire-postFatfireMonthlyIncome",
    DEFAULT_INPUT.postFatfireMonthlyIncome ?? 0
  );
  const [postFatfireIncomeEndAge, setPostFatfireIncomeEndAge] = useLocalStorage(
    "fire-postFatfireIncomeEndAge",
    DEFAULT_INPUT.postFatfireIncomeEndAge ?? 90
  );
  const [salaryIncreaseRate, setSalaryIncreaseRate] = useLocalStorage(
    "fire-salaryIncreaseRate",
    DEFAULT_INPUT.salaryIncreaseRate
  );
  const [annualInflation, setAnnualInflation] = useLocalStorage(
    "fire-annualInflation",
    DEFAULT_INPUT.annualInflation
  );
  const [accounts, setAccounts] = useLocalStorage<AccountToggles>(
    "fire-accounts",
    DEFAULT_INPUT.accounts
  );

  // Migrate old nisaEnabled to new separate NISA toggles
  useEffect(() => {
    const oldNisaEnabled = localStorage.getItem("fire-nisaEnabled");
    if (oldNisaEnabled !== null && !localStorage.getItem("fire-nisaTsumitateEnabled")) {
      try {
        const enabled = JSON.parse(oldNisaEnabled);
        // Create new accounts object with separate toggles
        const newAccounts = {
          ...accounts,
          nisaTsumitateEnabled: enabled,
          nisaGrowthEnabled: enabled,
        };
        setAccounts(newAccounts);
        // Clean up old key
        localStorage.removeItem("fire-nisaEnabled");
      } catch (e) {
        console.warn("Failed to migrate nisaEnabled:", e);
      }
    }
  }, []);

  const [idecoType, setIdecoType] = useLocalStorage<IDeCoType>(
    "fire-idecoType",
    DEFAULT_INPUT.idecoType
  );
  const [annualReturn, setAnnualReturn] = useLocalStorage(
    "fire-annualReturn",
    DEFAULT_INPUT.annualReturn
  );
  const [loans, setLoans] = useLocalStorage<Loan[]>("fire-loans", []);
  const [juniorNisaBalance, setJuniorNisaBalance] = useLocalStorage(
    "fire-juniorNisaBalance",
    DEFAULT_INPUT.juniorNisaBalance
  );
  const [swpDepletionAge, setSwpDepletionAge] = useLocalStorage(
    "fire-swpDepletionAge",
    DEFAULT_INPUT.swpDepletionAge ?? 90
  );
  const [initialIdecoBalance, setInitialIdecoBalance] = useLocalStorage(
    "fire-initialIdecoBalance",
    DEFAULT_INPUT.initialIdecoBalance ?? 0
  );
  const [initialNisaTsumitateBalance, setInitialNisaTsumitateBalance] = useLocalStorage(
    "fire-initialNisaTsumitateBalance",
    DEFAULT_INPUT.initialNisaTsumitateBalance ?? 0
  );
  const [initialNisaGrowthBalance, setInitialNisaGrowthBalance] = useLocalStorage(
    "fire-initialNisaGrowthBalance",
    DEFAULT_INPUT.initialNisaGrowthBalance ?? 0
  );
  const [initialTaxableBalance, setInitialTaxableBalance] = useLocalStorage(
    "fire-initialTaxableBalance",
    DEFAULT_INPUT.initialTaxableBalance ?? 0
  );
  const [pensionEnabled, setPensionEnabled] = useLocalStorage(
    "fire-pensionEnabled",
    DEFAULT_INPUT.pensionEnabled ?? false
  );
  const [pensionStartAge, setPensionStartAge] = useLocalStorage(
    "fire-pensionStartAge",
    DEFAULT_INPUT.pensionStartAge ?? 65
  );
  const [pensionMonthlyAmount, setPensionMonthlyAmount] = useLocalStorage(
    "fire-pensionMonthlyAmount",
    DEFAULT_INPUT.pensionMonthlyAmount ?? 0
  );
  const [pensionInflationAdjusted, setPensionInflationAdjusted] = useLocalStorage(
    "fire-pensionInflationAdjusted",
    DEFAULT_INPUT.pensionInflationAdjusted ?? true
  );
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const input: SimulationInput = {
    currentAge,
    targetFireAge,
    currentMonthlyIncome: monthlyIncome,
    monthlyExpenses,
    postFireMonthlyExpenses,
    postFireMonthlyIncome,
    postFireIncomeEndAge,
    lifestyleInflation,
    postFatfireMonthlyIncome,
    postFatfireIncomeEndAge,
    salaryIncreaseRate,
    annualInflation,
    loans,
    accounts,
    idecoType,
    juniorNisaBalance,
    annualReturn,
    swpDepletionAge,
    initialIdecoBalance,
    initialNisaTsumitateBalance,
    initialNisaGrowthBalance,
    initialTaxableBalance,
    pensionEnabled,
    pensionStartAge,
    pensionMonthlyAmount,
    pensionInflationAdjusted,
  };

  const debouncedInput = useDebounced(input, 150);

  useEffect(() => {
    const errors = validateSimulationInput(debouncedInput);
    setValidationErrors(errors);

    if (errors.length > 0) {
      setResult(null);
      setSimulationError(null);
      return;
    }

    try {
      setResult(runSimulation(debouncedInput));
      setSimulationError(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown simulation error";
      console.error("Simulation error:", e);
      setSimulationError(errorMessage);
      setResult(null);
    }
  }, [debouncedInput]);

  return (
    <SimulatorContext.Provider
      value={{
        currentAge, setCurrentAge,
        targetFireAge, setTargetFireAge,
        monthlyIncome, setMonthlyIncome,
        monthlyExpenses, setMonthlyExpenses,
        postFireMonthlyExpenses, setPostFireMonthlyExpenses,
        postFireMonthlyIncome, setPostFireMonthlyIncome,
        postFireIncomeEndAge, setPostFireIncomeEndAge,
        lifestyleInflation, setLifestyleInflation,
        postFatfireMonthlyIncome, setPostFatfireMonthlyIncome,
        postFatfireIncomeEndAge, setPostFatfireIncomeEndAge,
        salaryIncreaseRate, setSalaryIncreaseRate,
        annualInflation, setAnnualInflation,
        accounts, setAccounts,
        idecoType, setIdecoType,
        annualReturn, setAnnualReturn,
        loans, setLoans,
        juniorNisaBalance, setJuniorNisaBalance,
        swpDepletionAge, setSwpDepletionAge,
        initialIdecoBalance, setInitialIdecoBalance,
        initialNisaTsumitateBalance, setInitialNisaTsumitateBalance,
        initialNisaGrowthBalance, setInitialNisaGrowthBalance,
        initialTaxableBalance, setInitialTaxableBalance,
        pensionEnabled, setPensionEnabled,
        pensionStartAge, setPensionStartAge,
        pensionMonthlyAmount, setPensionMonthlyAmount,
        pensionInflationAdjusted, setPensionInflationAdjusted,
        result,
        validationErrors,
        simulationError,
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
