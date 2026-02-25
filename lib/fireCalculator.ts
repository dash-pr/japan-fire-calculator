// ─────────────────────────────────────────────
//  Japan FIRE Calculator — Core Simulation Engine
//  Monthly loop from current age → 90
//  Features: iDeCo, new NISA (tsumitate + growth),
//  Junior NISA, SWP drawdown, post-FIRE expenses
// ─────────────────────────────────────────────

export const LIFE_EXPECTANCY = 90;

export interface FutureExpense {
  id: string;
  label: string;
  yearsFromNow: number;
  amount: number; // in yen
}

export interface AccountToggles {
  idecoEnabled: boolean;
  nisaEnabled: boolean;
  taxableEnabled: boolean;
  juniorNisaEnabled: boolean;
}

export type IDeCoType = 'freelancer' | 'employee';

export interface SimulationInput {
  currentAge: number;
  targetFireAge: number;
  currentMonthlyIncome: number;   // yen/month
  monthlyExpenses: number;        // yen/month (working phase)
  postFireMonthlyExpenses: number;// yen/month (retirement phase, today's money)
  postFireMonthlyIncome?: number; // yen/month side income during retirement (today's money)
  lifestyleInflation: number;     // % per year — additional growth in post-fire expenses
  postFatfireMonthlyIncome?: number; // yen/month additional side income after FATFIRE is achieved
  salaryIncreaseRate: number;     // % per year  e.g. 3
  annualInflation: number;        // % per year  e.g. 2
  futureExpenses: FutureExpense[];
  accounts: AccountToggles;
  idecoType: IDeCoType;
  juniorNisaBalance: number;      // yen — lump-sum added at FIRE date
  annualReturn: number;           // % e.g. 6
  swpDepletionAge?: number;       // age by which portfolio reaches 0 (default LIFE_EXPECTANCY)
}

export interface MonthlySnapshot {
  age: number;
  year: number;
  month: number;
  portfolio: number;         // total net portfolio
  ideco: number;
  nisaTsumitate: number;
  nisaGrowth: number;
  nisa: number;              // nisaTsumitate + nisaGrowth (convenience)
  taxable: number;
  swpWithdrawal: number;     // monthly SWP withdrawal this month (0 during accumulation)
  requiredCapital: number;   // SWP-based capital needed at this point to reach 90
  leanFireCapital: number;
  fatFireCapital: number;
  monthlyExpenses: number;   // inflation-adjusted expenses for this month
  annualExpenses: number;
  // ── Cash-flow breakdown (new) ──────────────────────────────────────────
  grossIncome: number;       // salary before deductions (0 after FIRE unless side income)
  idecoCont: number;         // iDeCo contribution this month
  nisaTsumCont: number;      // NISA tsumitate contribution
  nisaGrowthCont: number;    // NISA growth contribution
  taxableCont: number;       // taxable brokerage contribution
  postFireSideIncome: number;// extra income in retirement (postFireMonthlyIncome, inflation-adj)
  postFatfireSideIncome: number; // extra income after FATFIRE achieved (inflation-adj)
}

export interface SimulationResult {
  snapshots: MonthlySnapshot[];
  leanFireYear?: number;
  leanFireAge?: number;
  fatFireYear?: number;
  fatFireAge?: number;
  nisaTsumitateExhaustionYear?: number;
  nisaTsumitateExhaustionAge?: number;
  nisaGrowthExhaustionYear?: number;
  nisaGrowthExhaustionAge?: number;
  totalIdecoContributed: number;
  totalNisaTsumitateContributed: number;
  totalNisaGrowthContributed: number;
  totalTaxableContributed: number;
  finalPortfolio: number;
  portfolioDepletionYear?: number;
  portfolioDepletionAge?: number;
  swpMonthlyAtFire: number;       // SWP monthly income at FIRE date (inflation-adjusted ¥)
}

// ── Japan iDeCo limits ────────────────────────────────────────────────────────
const IDECO_MAX_MONTHLY_FREELANCE = 68_000;
const IDECO_MAX_MONTHLY_EMPLOYEE  = 23_000;

// ── New NISA 2024 limits ──────────────────────────────────────────────────────
// Tsumitate (積立) slot
const NISA_TSUMITATE_ANNUAL  = 1_200_000;   // ¥1.2M/yr
const NISA_TSUMITATE_LIFETIME= 6_000_000;   // ¥6M lifetime
// Growth (成長投資) slot
const NISA_GROWTH_ANNUAL     = 2_400_000;   // ¥2.4M/yr
const NISA_GROWTH_LIFETIME   = 12_000_000;  // ¥12M lifetime

// ── Junior NISA (closed to new contributions 2024, but existing balances roll) ─
// modelled as a lump-sum already held at simulation start / FIRE date

// ── Tax rates ─────────────────────────────────────────────────────────────────
const INCOME_TAX_EFFECTIVE   = 0.20;
const CAPITAL_GAINS_TAX      = 0.20315;
const IDECO_WITHDRAWAL_TAX   = 0.10;  // simplified (退職所得控除 benefit)

// ── SWP helper: compute monthly payment from a portfolio that should reach 0
//   at the end of `monthsRemaining` months, earning `monthlyRate` per month.
//   This is the standard annuity-due formula.
function swpPayment(portfolio: number, monthlyRate: number, monthsRemaining: number): number {
  if (monthsRemaining <= 0) return portfolio; // edge-case: already at end
  if (monthlyRate < 1e-9) return portfolio / monthsRemaining; // zero-rate
  const pv = portfolio;
  const r  = monthlyRate;
  const n  = monthsRemaining;
  // PMT = PV * r / (1 - (1+r)^-n)
  return pv * r / (1 - Math.pow(1 + r, -n));
}

export function runSimulation(input: SimulationInput): SimulationResult {
  const {
    currentAge,
    targetFireAge,
    currentMonthlyIncome,
    monthlyExpenses,
    postFireMonthlyExpenses,
    postFireMonthlyIncome = 0,
    lifestyleInflation = 0,
    postFatfireMonthlyIncome = 0,
    salaryIncreaseRate,
    annualInflation,
    futureExpenses,
    accounts,
    idecoType,
    juniorNisaBalance,
    annualReturn,
    swpDepletionAge = LIFE_EXPECTANCY,
  } = input;

  const startYear = new Date().getFullYear();
  // NOTE: annualReturn is NOMINAL (before inflation). Real return is implicitly calculated
  // as portfolio growth minus expense growth. E.g., 6% nominal with 2% inflation ≈ 3.9% real.
  const monthlyReturn    = (annualReturn / 100) / 12;
  const monthlyInflation = (annualInflation / 100) / 12;
  const monthlyIncomeGrowth = (salaryIncreaseRate / 100) / 12;
  const monthlyLifestyleInflation = (lifestyleInflation / 100) / 12;

  // ── Account balances ──────────────────────────────────────────────────────
  let ideco          = 0;
  let nisaTsumitate  = 0;
  let nisaGrowth     = 0;
  let taxable        = 0;
  let juniorNisa     = 0;            // grows but not contributed to
  let totalTaxableCostBasis = 0;

  // NISA slot usage trackers
  let nisaTsumitateAnnualUsed    = 0;
  let nisaTsumitateLifetimeUsed  = 0;
  let nisaGrowthAnnualUsed       = 0;
  let nisaGrowthLifetimeUsed     = 0;

  const idecoMonthlyLimit = accounts.idecoEnabled
    ? (idecoType === 'employee' ? IDECO_MAX_MONTHLY_EMPLOYEE : IDECO_MAX_MONTHLY_FREELANCE)
    : 0;

  let monthlyIncome          = currentMonthlyIncome;
  let currentMonthlyExpenses = monthlyExpenses;

  // ── Result trackers ───────────────────────────────────────────────────────
  const snapshots: MonthlySnapshot[] = [];
  let leanFireYear: number | undefined;
  let leanFireAge:  number | undefined;
  let fatFireYear:  number | undefined;
  let fatFireAge:   number | undefined;
  let nisaTsumitateExhaustionYear: number | undefined;
  let nisaTsumitateExhaustionAge:  number | undefined;
  let nisaGrowthExhaustionYear:    number | undefined;
  let nisaGrowthExhaustionAge:     number | undefined;
  let portfolioDepletionYear: number | undefined;
  let portfolioDepletionAge:  number | undefined;
  let totalIdecoContributed_         = 0;
  let totalNisaTsumitateContributed_ = 0;
  let totalNisaGrowthContributed_    = 0;
  let totalTaxableContributed_       = 0;

  // SWP amount locked in at FIRE date
  let swpMonthlyAtFire = 0;
  let juniorNisaInjected = false;

  const totalMonths = (LIFE_EXPECTANCY - currentAge) * 12;
  const calendarMonthStart = new Date().getMonth() + 1; // 1-based

  for (let m = 0; m < totalMonths; m++) {
    const ageDecimal  = currentAge + m / 12;
    const year        = startYear + Math.floor(m / 12);
    const monthInYear = ((calendarMonthStart - 1 + m) % 12) + 1;
    const isFired     = ageDecimal >= targetFireAge;

    // ── Income & expense growth ───────────────────────────────────────────
    if (m > 0) monthlyIncome *= (1 + monthlyIncomeGrowth);
    if (m > 0) currentMonthlyExpenses *= (1 + monthlyInflation);

    // ── At FIRE: inject Junior NISA balance (grown from simulation start) ──
    if (!juniorNisaInjected && isFired && accounts.juniorNisaEnabled && juniorNisaBalance > 0) {
      // grow the junior NISA balance from today to FIRE date
      const monthsToFire = (targetFireAge - currentAge) * 12;
      juniorNisa = juniorNisaBalance * Math.pow(1 + monthlyReturn, monthsToFire);
      // Fold into NISA growth bucket (tax-free)
      nisaGrowth += juniorNisa;
      juniorNisa = 0;
      juniorNisaInjected = true;
    }

    // ── iDeCo tax benefit ─────────────────────────────────────────────────
    const idecoTaxSaving = accounts.idecoEnabled && !isFired
      ? idecoMonthlyLimit * INCOME_TAX_EFFECTIVE
      : 0;

    // Expenses for this month (use postFire amount during retirement)
    // Accounts for both inflation and lifestyle inflation during retirement
    const baseExpense = isFired
      ? postFireMonthlyExpenses
          * Math.pow(1 + monthlyInflation, (targetFireAge - currentAge) * 12 + (m - Math.round((targetFireAge - currentAge) * 12)))
          * Math.pow(1 + monthlyLifestyleInflation, m - Math.round((targetFireAge - currentAge) * 12))
      : currentMonthlyExpenses;

    // ── Disposable income (accumulation only) ────────────────────────────
    const disposableIncome = isFired ? 0 : Math.max(
      0,
      monthlyIncome
        - currentMonthlyExpenses
        - (accounts.idecoEnabled ? idecoMonthlyLimit : 0)
        + idecoTaxSaving
    );

    // ── Future lump-sum expenses (accumulation only) ──────────────────────
    let extraExpense = 0;
    if (!isFired) {
      for (const fe of futureExpenses) {
        const expenseYear = startYear + fe.yearsFromNow;
        if (year === expenseYear && monthInYear === 1) {
          extraExpense += fe.amount / 12;
        }
      }
    }

    let remainingSavings = disposableIncome - extraExpense;

    // ── Contributions (accumulation phase only) ───────────────────────────
    if (!isFired) {
      // iDeCo
      if (accounts.idecoEnabled) {
        ideco += idecoMonthlyLimit;
        totalIdecoContributed_ += idecoMonthlyLimit;
      }

      // NISA — tsumitate slot first, then growth
      if (accounts.nisaEnabled) {
        if (monthInYear === 1) { nisaTsumitateAnnualUsed = 0; nisaGrowthAnnualUsed = 0; }

        // Tsumitate
        if (nisaTsumitateLifetimeUsed < NISA_TSUMITATE_LIFETIME) {
          const space = Math.min(
            NISA_TSUMITATE_ANNUAL  - nisaTsumitateAnnualUsed,
            NISA_TSUMITATE_LIFETIME - nisaTsumitateLifetimeUsed,
            Math.max(0, remainingSavings)
          );
          if (space > 0) {
            nisaTsumitate              += space;
            nisaTsumitateAnnualUsed    += space;
            nisaTsumitateLifetimeUsed  += space;
            totalNisaTsumitateContributed_ += space;
            remainingSavings           -= space;

            if (nisaTsumitateLifetimeUsed >= NISA_TSUMITATE_LIFETIME && !nisaTsumitateExhaustionYear) {
              nisaTsumitateExhaustionYear = year;
              nisaTsumitateExhaustionAge  = Math.round(ageDecimal);
            }
          }
        }

        // Growth slot
        if (nisaGrowthLifetimeUsed < NISA_GROWTH_LIFETIME && remainingSavings > 0) {
          const space = Math.min(
            NISA_GROWTH_ANNUAL  - nisaGrowthAnnualUsed,
            NISA_GROWTH_LIFETIME - nisaGrowthLifetimeUsed,
            Math.max(0, remainingSavings)
          );
          if (space > 0) {
            nisaGrowth              += space;
            nisaGrowthAnnualUsed    += space;
            nisaGrowthLifetimeUsed  += space;
            totalNisaGrowthContributed_ += space;
            remainingSavings        -= space;

            if (nisaGrowthLifetimeUsed >= NISA_GROWTH_LIFETIME && !nisaGrowthExhaustionYear) {
              nisaGrowthExhaustionYear = year;
              nisaGrowthExhaustionAge  = Math.round(ageDecimal);
            }
          }
        }
      }

      // Taxable remainder
      if (accounts.taxableEnabled && remainingSavings > 0) {
        taxable                   += remainingSavings;
        totalTaxableCostBasis     += remainingSavings;
        totalTaxableContributed_  += remainingSavings;
      }
    }

    // ── Portfolio growth ───────────────────────────────────────────────────
    ideco         *= (1 + monthlyReturn);
    nisaTsumitate *= (1 + monthlyReturn);
    nisaGrowth    *= (1 + monthlyReturn);
    taxable       *= (1 + monthlyReturn);

    // ── Retirement income snapshot helpers ────────────────────────────────
    function taxableNetValue() {
      const gains = Math.max(0, taxable - totalTaxableCostBasis);
      return taxable - gains * CAPITAL_GAINS_TAX;
    }
    function totalPortfolioNet() {
      return ideco
        + nisaTsumitate
        + nisaGrowth
        + (accounts.taxableEnabled ? taxableNetValue() : 0);
    }

    // ── SWP: recalculate each month to exactly reach target age ────────────
    if (isFired) {
      // Recalculate SWP each month based on remaining time and remaining portfolio
      // This ensures the portfolio exactly reaches ¥0 at the target depletion age
      const depletionAge = Math.max(targetFireAge + 1, swpDepletionAge);
      const monthsLeftTotal = (depletionAge - targetFireAge) * 12;
      const monthsElapsed = m - Math.round((targetFireAge - currentAge) * 12);
      const monthsRemaining = monthsLeftTotal - monthsElapsed;

      const netPortfolio = totalPortfolioNet();
      if (monthsRemaining > 0 && netPortfolio > 0) {
        swpMonthlyAtFire = swpPayment(netPortfolio, monthlyReturn, monthsRemaining);
      } else if (monthsRemaining <= 0) {
        swpMonthlyAtFire = 0; // Past depletion age, no withdrawal
      }

      // The SWP withdrawal target this month
      const swpTarget = swpMonthlyAtFire;

      // Withdrawal order: taxable → NISA (growth first, then tsumitate) → iDeCo (60+)
      let needed = swpTarget;

      if (accounts.taxableEnabled && taxable > 0 && needed > 0) {
        const gains = Math.max(0, taxable - totalTaxableCostBasis);
        const gainRatio = taxable > 0 ? gains / taxable : 0;
        const taxFactor = Math.max(0.01, 1 - gainRatio * CAPITAL_GAINS_TAX);
        const grossNeeded   = needed / taxFactor;
        const grossWithdraw = Math.min(taxable, grossNeeded);
        const netReceived   = grossWithdraw * taxFactor;
        const basisFrac     = taxable > 0 ? totalTaxableCostBasis / taxable : 0;
        totalTaxableCostBasis = Math.max(0, totalTaxableCostBasis - grossWithdraw * basisFrac);
        taxable  -= grossWithdraw;
        needed   = Math.max(0, needed - netReceived);
      }

      if (nisaGrowth > 0 && needed > 0) {
        const w = Math.min(nisaGrowth, needed);
        nisaGrowth -= w;
        needed     -= w;
      }

      if (nisaTsumitate > 0 && needed > 0) {
        const w = Math.min(nisaTsumitate, needed);
        nisaTsumitate -= w;
        needed        -= w;
      }

      if (accounts.idecoEnabled && ideco > 0 && needed > 0 && ageDecimal >= 60) {
        const grossNeeded   = needed / (1 - IDECO_WITHDRAWAL_TAX);
        const grossWithdraw = Math.min(ideco, grossNeeded);
        const netReceived   = grossWithdraw * (1 - IDECO_WITHDRAWAL_TAX);
        ideco  -= grossWithdraw;
        needed = Math.max(0, needed - netReceived);
      }

      // Depletion detection
      if (!portfolioDepletionYear && totalPortfolioNet() <= 0) {
        portfolioDepletionYear = year;
        portfolioDepletionAge  = Math.round(ageDecimal);
      }
    }

    // ── Snapshot ───────────────────────────────────────────────────────────
    const tNet = taxableNetValue();
    const tot  = totalPortfolioNet();

    // SWP-based required capital: PMT needed to support postFireMonthlyExpenses
    // from retirement to age 90, grown by inflation to current point.
    const inflationFactor = Math.pow(1 + monthlyInflation, m);
    const inflatedPostFireExpense = !isFired
      ? postFireMonthlyExpenses * Math.pow(1 + monthlyInflation, (targetFireAge - currentAge) * 12) // at FIRE date
      : baseExpense;

    const effectiveEndAge = Math.max(targetFireAge + 1, swpDepletionAge);
    const monthsToEnd = Math.max(0, (effectiveEndAge - ageDecimal) * 12);
    const requiredCapital = monthsToEnd > 0
      ? inflatedPostFireExpense / monthlyReturn * (1 - Math.pow(1 + monthlyReturn, -monthsToEnd))
      : 0;
    const leanFireCapital = requiredCapital;
    const fatFireCapital  = requiredCapital * 1.5; // Fat FIRE = 1.5× (50% safety buffer)

    if (!leanFireYear && tot >= leanFireCapital && leanFireCapital > 0) {
      leanFireYear = year; leanFireAge = Math.round(ageDecimal);
    }
    if (!fatFireYear && tot >= fatFireCapital && fatFireCapital > 0) {
      fatFireYear = year; fatFireAge = Math.round(ageDecimal);
    }

    const annualExpenses = (isFired ? baseExpense : currentMonthlyExpenses) * 12;

    // Per-month contribution tracking for cash-flow tab
    const idecoCont_     = (!isFired && accounts.idecoEnabled) ? idecoMonthlyLimit : 0;
    // Approximation: derive NISA + taxable contribs from running totals diff
    // We snapshot running totals before/after — simpler to re-derive from logic above.
    // For yearly rollup it's accurate enough since both in same iteration.
    const nisaTsumMonthlyMax = NISA_TSUMITATE_ANNUAL / 12;
    const nisaGrowthMonthlyMax = NISA_GROWTH_ANNUAL / 12;
    const disposableForContrib = !isFired
      ? Math.max(0, monthlyIncome - currentMonthlyExpenses - idecoCont_ + (idecoCont_ * INCOME_TAX_EFFECTIVE))
      : 0;
    const nisaTsumCont_  = !isFired && accounts.nisaEnabled
      ? Math.min(nisaTsumMonthlyMax, nisaTsumitateLifetimeUsed < NISA_TSUMITATE_LIFETIME ? Math.max(0, disposableForContrib) : 0, disposableForContrib)
      : 0;
    const leftAfterNisaT = Math.max(0, disposableForContrib - nisaTsumCont_);
    const nisaGrowCont_  = !isFired && accounts.nisaEnabled
      ? Math.min(nisaGrowthMonthlyMax, leftAfterNisaT)
      : 0;
    const leftAfterNisa  = Math.max(0, leftAfterNisaT - nisaGrowCont_);
    const taxableCont_   = !isFired && accounts.taxableEnabled ? leftAfterNisa : 0;

    // Post-FIRE side income (inflation-adjusted to current month)
    const postFireSideIncomeNow = isFired
      ? postFireMonthlyIncome * Math.pow(1 + monthlyInflation, m)
      : 0;

    // Post-FATFIRE side income (kicks in when portfolio >= fatFireCapital)
    const postFatfireSideIncomeNow = isFired && tot >= fatFireCapital && postFatfireMonthlyIncome > 0
      ? postFatfireMonthlyIncome * Math.pow(1 + monthlyInflation, m)
      : 0;

    // SWP withdrawal is 0 if portfolio is depleted
    const actualSwpWithdrawal = isFired && tot > 0
      ? Math.round(swpMonthlyAtFire)
      : 0;

    snapshots.push({
      age:           Math.round(ageDecimal * 10) / 10,
      year,
      month:         monthInYear,
      portfolio:     Math.round(tot),
      ideco:         Math.round(ideco),
      nisaTsumitate: Math.round(nisaTsumitate),
      nisaGrowth:    Math.round(nisaGrowth),
      nisa:          Math.round(nisaTsumitate + nisaGrowth),
      taxable:       Math.round(accounts.taxableEnabled ? tNet : 0),
      swpWithdrawal: actualSwpWithdrawal,
      requiredCapital: Math.round(requiredCapital),
      leanFireCapital: Math.round(leanFireCapital),
      fatFireCapital:  Math.round(fatFireCapital),
      monthlyExpenses: Math.round(isFired ? baseExpense : currentMonthlyExpenses),
      annualExpenses:  Math.round(annualExpenses),
      grossIncome:     Math.round(isFired ? 0 : monthlyIncome),
      idecoCont:       Math.round(idecoCont_),
      nisaTsumCont:    Math.round(nisaTsumCont_),
      nisaGrowthCont:  Math.round(nisaGrowCont_),
      taxableCont:     Math.round(taxableCont_),
      postFireSideIncome: Math.round(postFireSideIncomeNow),
      postFatfireSideIncome: Math.round(postFatfireSideIncomeNow),
    });
  }

  return {
    snapshots,
    leanFireYear,
    leanFireAge,
    fatFireYear,
    fatFireAge,
    nisaTsumitateExhaustionYear,
    nisaTsumitateExhaustionAge,
    nisaGrowthExhaustionYear,
    nisaGrowthExhaustionAge,
    totalIdecoContributed:          Math.round(totalIdecoContributed_),
    totalNisaTsumitateContributed:  Math.round(totalNisaTsumitateContributed_),
    totalNisaGrowthContributed:     Math.round(totalNisaGrowthContributed_),
    totalTaxableContributed:        Math.round(totalTaxableContributed_),
    finalPortfolio: snapshots[snapshots.length - 1]?.portfolio ?? 0,
    portfolioDepletionYear,
    portfolioDepletionAge,
    swpMonthlyAtFire,
  };
}

// ── Utility: format yen with Japanese suffix
export function formatYen(amount: number): string {
  if (Math.abs(amount) >= 1_0000_0000) { // 100M+
    return `¥${(amount / 1_0000_0000).toFixed(1)}億`;
  }
  if (Math.abs(amount) >= 1_0000) { // 10k+
    return `¥${(amount / 1_0000).toFixed(0)}万`;
  }
  return `¥${amount.toLocaleString()}`;
}

export function formatYenFull(amount: number): string {
  return `¥${Math.round(amount).toLocaleString()}`;
}

// ── Popular NISA funds for the fund selector
export type SectorWeights = {
  "US Equity": number;
  "Japan Equity": number;
  "Europe Equity": number;
  "Emerging Mkts": number;
  "Japan REIT": number;
  "Global REIT": number;
  "Bonds": number;
  "Other": number;
};

export interface NisaFund {
  name: string;
  ticker: string;
  category: string;
  expenseRatio: number;     // % annual
  expectedReturn: number;   // % annual (long-run estimate used in simulation)
  return1y: number;         // % (approx, JPY-denominated)
  return3y: number;         // % annualised
  return5y: number;         // % annualised
  return10y: number;        // % annualised
  description: string;
  currency: string;
  benchmark: string;
  sectorWeights: SectorWeights;
}

export const NISA_FUNDS: NisaFund[] = [
  {
    name: "eMAXIS Slim 全世界株式(オール・カントリー)",
    ticker: "AC",
    category: "Global Equity",
    expenseRatio: 0.05775,
    expectedReturn: 8.5,
    return1y: 27.1,
    return3y: 17.8,
    return5y: 19.6,
    return10y: 14.2,
    description: "Most popular all-world fund. Tracks MSCI ACWI covering ~2,900 stocks in 47 countries.",
    currency: "JPY",
    benchmark: "MSCI ACWI",
    sectorWeights: { "US Equity": 63, "Japan Equity": 6, "Europe Equity": 17, "Emerging Mkts": 11, "Japan REIT": 0, "Global REIT": 0, "Bonds": 0, "Other": 3 },
  },
  {
    name: "eMAXIS Slim 米国株式(S&P500)",
    ticker: "SP5",
    category: "US Equity",
    expenseRatio: 0.09372,
    expectedReturn: 10.2,
    return1y: 32.4,
    return3y: 22.1,
    return5y: 24.3,
    return10y: 17.5,
    description: "Tracks S&P 500, exposing investors to 500 large US companies. Historically high returns.",
    currency: "JPY",
    benchmark: "S&P 500",
    sectorWeights: { "US Equity": 100, "Japan Equity": 0, "Europe Equity": 0, "Emerging Mkts": 0, "Japan REIT": 0, "Global REIT": 0, "Bonds": 0, "Other": 0 },
  },
  {
    name: "楽天・全米株式インデックスファンド",
    ticker: "VTI",
    category: "US Equity",
    expenseRatio: 0.162,
    expectedReturn: 9.8,
    return1y: 30.1,
    return3y: 20.2,
    return5y: 22.4,
    return10y: 16.3,
    description: "Tracks the entire US stock market via Vanguard VTI. Broader than S&P 500.",
    currency: "JPY",
    benchmark: "CRSP US Total Market",
    sectorWeights: { "US Equity": 100, "Japan Equity": 0, "Europe Equity": 0, "Emerging Mkts": 0, "Japan REIT": 0, "Global REIT": 0, "Bonds": 0, "Other": 0 },
  },
  {
    name: "SBI・V・S&P500インデックスファンド",
    ticker: "SBIS",
    category: "US Equity",
    expenseRatio: 0.0938,
    expectedReturn: 10.1,
    return1y: 31.8,
    return3y: 21.6,
    return5y: 23.8,
    return10y: 16.9,
    description: "Ultra-low cost S&P 500 tracker from SBI Asset Management. Competing with eMAXIS Slim.",
    currency: "JPY",
    benchmark: "S&P 500",
    sectorWeights: { "US Equity": 100, "Japan Equity": 0, "Europe Equity": 0, "Emerging Mkts": 0, "Japan REIT": 0, "Global REIT": 0, "Bonds": 0, "Other": 0 },
  },
  {
    name: "eMAXIS Slim 先進国株式インデックス",
    ticker: "MSCI-W",
    category: "Developed Markets",
    expenseRatio: 0.09889,
    expectedReturn: 7.8,
    return1y: 24.3,
    return3y: 16.1,
    return5y: 18.2,
    return10y: 13.4,
    description: "Covers developed market equities excluding Japan. Tracks MSCI World index.",
    currency: "JPY",
    benchmark: "MSCI World ex-Japan",
    sectorWeights: { "US Equity": 72, "Japan Equity": 0, "Europe Equity": 22, "Emerging Mkts": 0, "Japan REIT": 0, "Global REIT": 0, "Bonds": 0, "Other": 6 },
  },
  {
    name: "eMAXIS Slim バランス(8資産均等型)",
    ticker: "BAL8",
    category: "Balanced",
    expenseRatio: 0.143,
    expectedReturn: 5.5,
    return1y: 14.2,
    return3y: 8.7,
    return5y: 9.9,
    return10y: 8.1,
    description: "8-asset class balanced fund. Stocks, bonds, REITs across domestic and international markets.",
    currency: "JPY",
    benchmark: "Custom Composite",
    sectorWeights: { "US Equity": 12, "Japan Equity": 13, "Europe Equity": 13, "Emerging Mkts": 12, "Japan REIT": 12, "Global REIT": 13, "Bonds": 25, "Other": 0 },
  },
  {
    name: "ニッセイ・インデックスファンド(世界株式)",
    ticker: "NIAW",
    category: "Global Equity",
    expenseRatio: 0.1133,
    expectedReturn: 8.2,
    return1y: 26.5,
    return3y: 17.1,
    return5y: 19.0,
    return10y: 13.8,
    description: "Nissay's low-cost global equity fund covering developed and emerging markets.",
    currency: "JPY",
    benchmark: "MSCI ACWI",
    sectorWeights: { "US Equity": 62, "Japan Equity": 7, "Europe Equity": 17, "Emerging Mkts": 11, "Japan REIT": 0, "Global REIT": 0, "Bonds": 0, "Other": 3 },
  },
  {
    name: "eMAXIS Slim 新興国株式インデックス",
    ticker: "EM",
    category: "Emerging Markets",
    expenseRatio: 0.1518,
    expectedReturn: 7.0,
    return1y: 12.3,
    return3y: 6.8,
    return5y: 8.7,
    return10y: 6.9,
    description: "Emerging markets exposure covering China, Taiwan, India and more via MSCI EM index.",
    currency: "JPY",
    benchmark: "MSCI EM",
    sectorWeights: { "US Equity": 0, "Japan Equity": 0, "Europe Equity": 0, "Emerging Mkts": 100, "Japan REIT": 0, "Global REIT": 0, "Bonds": 0, "Other": 0 },
  },
];
