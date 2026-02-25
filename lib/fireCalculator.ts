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
  salaryIncreaseRate: number;     // % per year  e.g. 3
  annualInflation: number;        // % per year  e.g. 2
  futureExpenses: FutureExpense[];
  accounts: AccountToggles;
  idecoType: IDeCoType;
  juniorNisaBalance: number;      // yen — lump-sum added at FIRE date
  annualReturn: number;           // % e.g. 6
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
    salaryIncreaseRate,
    annualInflation,
    futureExpenses,
    accounts,
    idecoType,
    juniorNisaBalance,
    annualReturn,
  } = input;

  const startYear = new Date().getFullYear();
  const monthlyReturn    = (annualReturn / 100) / 12;
  const monthlyInflation = (annualInflation / 100) / 12;
  const monthlyIncomeGrowth = (salaryIncreaseRate / 100) / 12;

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
    const baseExpense = isFired
      ? postFireMonthlyExpenses * Math.pow(1 + monthlyInflation, (targetFireAge - currentAge) * 12 + (m - Math.round((targetFireAge - currentAge) * 12)))
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

    // ── SWP: compute & lock monthly withdrawal at FIRE ────────────────────
    if (isFired) {
      // Lock in the SWP amount once at the exact FIRE month
      if (swpMonthlyAtFire === 0) {
        const monthsLeft = (LIFE_EXPECTANCY - targetFireAge) * 12;
        swpMonthlyAtFire = swpPayment(totalPortfolioNet(), monthlyReturn, monthsLeft);
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

    const monthsToEnd = Math.max(0, (LIFE_EXPECTANCY - ageDecimal) * 12);
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
      swpWithdrawal: isFired ? Math.round(swpMonthlyAtFire) : 0,
      requiredCapital: Math.round(requiredCapital),
      leanFireCapital: Math.round(leanFireCapital),
      fatFireCapital:  Math.round(fatFireCapital),
      monthlyExpenses: Math.round(isFired ? baseExpense : currentMonthlyExpenses),
      annualExpenses:  Math.round(annualExpenses),
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
export interface NisaFund {
  name: string;
  ticker: string;
  category: string;
  expenseRatio: number;       // % annual
  expectedReturn: number;     // % annual (historical / estimated)
  description: string;
  currency: string;
  benchmark: string;
}

export const NISA_FUNDS: NisaFund[] = [
  {
    name: "eMAXIS Slim 全世界株式(オール・カントリー)",
    ticker: "AC",
    category: "Global Equity",
    expenseRatio: 0.05775,
    expectedReturn: 8.5,
    description: "Most popular all-world fund. Tracks MSCI ACWI covering ~2,900 stocks in 47 countries.",
    currency: "JPY",
    benchmark: "MSCI ACWI",
  },
  {
    name: "eMAXIS Slim 米国株式(S&P500)",
    ticker: "SP5",
    category: "US Equity",
    expenseRatio: 0.09372,
    expectedReturn: 10.2,
    description: "Tracks S&P 500, exposing investors to 500 large US companies. Historically high returns.",
    currency: "JPY",
    benchmark: "S&P 500",
  },
  {
    name: "楽天・全米株式インデックスファンド",
    ticker: "VTI",
    category: "US Equity",
    expenseRatio: 0.162,
    expectedReturn: 9.8,
    description: "Tracks the entire US stock market via Vanguard VTI. Broader than S&P 500.",
    currency: "JPY",
    benchmark: "CRSP US Total Market",
  },
  {
    name: "SBI・V・S&P500インデックスファンド",
    ticker: "SBIS",
    category: "US Equity",
    expenseRatio: 0.0938,
    expectedReturn: 10.1,
    description: "Ultra-low cost S&P 500 tracker from SBI Asset Management. Competing with eMAXIS Slim.",
    currency: "JPY",
    benchmark: "S&P 500",
  },
  {
    name: "eMAXIS Slim 先進国株式インデックス",
    ticker: "MSCI-W",
    category: "Developed Markets",
    expenseRatio: 0.09889,
    expectedReturn: 7.8,
    description: "Covers developed market equities excluding Japan. Tracks MSCI World index.",
    currency: "JPY",
    benchmark: "MSCI World ex-Japan",
  },
  {
    name: "eMAXIS Slim バランス(8資産均等型)",
    ticker: "BAL8",
    category: "Balanced",
    expenseRatio: 0.143,
    expectedReturn: 5.5,
    description: "8-asset class balanced fund. Stocks, bonds, REITs across domestic and international markets.",
    currency: "JPY",
    benchmark: "Custom Composite",
  },
  {
    name: "ニッセイ・インデックスファンド(世界株式)",
    ticker: "NIAW",
    category: "Global Equity",
    expenseRatio: 0.1133,
    expectedReturn: 8.2,
    description: "Nissay's low-cost global equity fund covering developed and emerging markets.",
    currency: "JPY",
    benchmark: "MSCI ACWI",
  },
  {
    name: "eMAXIS Slim 新興国株式インデックス",
    ticker: "EM",
    category: "Emerging Markets",
    expenseRatio: 0.1518,
    expectedReturn: 7.0,
    description: "Emerging markets exposure covering China, Taiwan, India and more via MSCI EM index.",
    currency: "JPY",
    benchmark: "MSCI EM",
  },
];
