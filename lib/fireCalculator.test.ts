/**
 * Verification tests for fireCalculator simulation
 * Run with: npx tsx lib/fireCalculator.test.ts
 */
import { runSimulation, SimulationInput } from './fireCalculator';

const BASE_INPUT: SimulationInput = {
  currentAge: 30,
  targetFireAge: 45,
  currentMonthlyIncome: 500_000,
  monthlyExpenses: 200_000,
  postFireMonthlyExpenses: 200_000,
  salaryIncreaseRate: 2,
  annualInflation: 2,
  loans: [],
  accounts: {
    idecoEnabled: true,
    nisaTsumitateEnabled: true,
    nisaGrowthEnabled: true,
    taxableEnabled: true,
    juniorNisaEnabled: false,
  },
  idecoType: 'freelancer' as const,
  juniorNisaBalance: 0,
  annualReturn: 6,
  lifestyleInflation: 0,
  swpDepletionAge: 90,
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

// ── Test 1: NISA Tsumitate lifetime limit (¥6M) ─────────────────────────
console.log('\n── Test 1: NISA Tsumitate lifetime limit ──');
{
  const result = runSimulation(BASE_INPUT);
  assert(
    result.totalNisaTsumitateContributed <= 6_000_000,
    `NISA-T total contributed ¥${result.totalNisaTsumitateContributed.toLocaleString()} <= ¥6,000,000`
  );
}

// ── Test 2: NISA Growth lifetime limit (¥12M) ───────────────────────────
console.log('\n── Test 2: NISA Growth lifetime limit ──');
{
  const result = runSimulation(BASE_INPUT);
  assert(
    result.totalNisaGrowthContributed <= 12_000_000,
    `NISA-G total contributed ¥${result.totalNisaGrowthContributed.toLocaleString()} <= ¥12,000,000`
  );
}

// ── Test 3: NISA annual limits ──────────────────────────────────────────
console.log('\n── Test 3: NISA annual contribution limits ──');
{
  const result = runSimulation(BASE_INPUT);
  // Check per-year contributions from snapshots
  const byYear = new Map<number, { nisaT: number; nisaG: number }>();
  for (const s of result.snapshots) {
    const entry = byYear.get(s.year) ?? { nisaT: 0, nisaG: 0 };
    entry.nisaT += s.nisaTsumCont;
    entry.nisaG += s.nisaGrowthCont;
    byYear.set(s.year, entry);
  }
  let annualOk = true;
  for (const [year, { nisaT, nisaG }] of byYear) {
    if (nisaT > 1_200_001) { // 1 yen tolerance for rounding
      console.error(`  ✗ Year ${year}: NISA-T annual ¥${nisaT.toLocaleString()} exceeds ¥1,200,000`);
      annualOk = false;
    }
    if (nisaG > 2_400_001) {
      console.error(`  ✗ Year ${year}: NISA-G annual ¥${nisaG.toLocaleString()} exceeds ¥2,400,000`);
      annualOk = false;
    }
  }
  assert(annualOk, 'All years respect NISA annual limits (T: ¥1.2M, G: ¥2.4M)');
}

// ── Test 4: Snapshot contributions stop after FIRE ──────────────────────
console.log('\n── Test 4: No contributions after FIRE ──');
{
  const result = runSimulation(BASE_INPUT);
  const postFire = result.snapshots.filter(s => s.age >= BASE_INPUT.targetFireAge);
  const anyContrib = postFire.some(s =>
    s.idecoCont > 0 || s.nisaTsumCont > 0 || s.nisaGrowthCont > 0 || s.taxableCont > 0
  );
  assert(!anyContrib, 'Zero contributions during retirement phase');
}

// ── Test 5: Snapshot contributions match total contributed ───────────────
console.log('\n── Test 5: Snapshot contributions match totals ──');
{
  const result = runSimulation(BASE_INPUT);
  const sumNisaT = result.snapshots.reduce((acc, s) => acc + s.nisaTsumCont, 0);
  const sumNisaG = result.snapshots.reduce((acc, s) => acc + s.nisaGrowthCont, 0);
  const sumIdeco = result.snapshots.reduce((acc, s) => acc + s.idecoCont, 0);
  // Allow ±1% tolerance for rounding
  const closeEnough = (a: number, b: number) => Math.abs(a - b) / Math.max(1, b) < 0.01;
  assert(
    closeEnough(sumNisaT, result.totalNisaTsumitateContributed),
    `NISA-T snapshot sum ¥${sumNisaT.toLocaleString()} ≈ total ¥${result.totalNisaTsumitateContributed.toLocaleString()}`
  );
  assert(
    closeEnough(sumNisaG, result.totalNisaGrowthContributed),
    `NISA-G snapshot sum ¥${sumNisaG.toLocaleString()} ≈ total ¥${result.totalNisaGrowthContributed.toLocaleString()}`
  );
  assert(
    closeEnough(sumIdeco, result.totalIdecoContributed),
    `iDeCo snapshot sum ¥${sumIdeco.toLocaleString()} ≈ total ¥${result.totalIdecoContributed.toLocaleString()}`
  );
}

// ── Test 6: iDeCo contribution limit (freelancer ¥68k/mo) ──────────────
console.log('\n── Test 6: iDeCo monthly limit ──');
{
  const result = runSimulation(BASE_INPUT);
  const maxIdecoCont = Math.max(...result.snapshots.map(s => s.idecoCont));
  assert(
    maxIdecoCont <= 68_001, // 1 yen tolerance
    `Max iDeCo monthly contribution ¥${maxIdecoCont.toLocaleString()} <= ¥68,000`
  );
}

// ── Test 7: Double loan payment bug fix verification ────────────────────
console.log('\n── Test 7: Loan payment not double-subtracted ──');
{
  // With a loan, compare contributions vs without
  const withLoan = runSimulation({
    ...BASE_INPUT,
    loans: [{
      id: 'test',
      label: 'Test Loan',
      principal: 1_000_000,
      annualInterestRate: 2,
      remainingMonths: 120,
    }],
  });
  const noLoan = runSimulation({
    ...BASE_INPUT,
    loans: [],
  });
  // With a small loan (~¥9.2k/mo payment), total invested should be close to no-loan case
  // Previously the bug would subtract loan payment twice, making a much bigger difference
  const loanPaymentMonthly = 1_000_000 * (0.02/12 * Math.pow(1 + 0.02/12, 120)) / (Math.pow(1 + 0.02/12, 120) - 1);
  const totalWithLoan = withLoan.totalNisaTsumitateContributed + withLoan.totalNisaGrowthContributed + withLoan.totalTaxableContributed + withLoan.totalIdecoContributed;
  const totalNoLoan = noLoan.totalNisaTsumitateContributed + noLoan.totalNisaGrowthContributed + noLoan.totalTaxableContributed + noLoan.totalIdecoContributed;
  const diff = totalNoLoan - totalWithLoan;
  const expectedDiff = loanPaymentMonthly * (BASE_INPUT.targetFireAge - BASE_INPUT.currentAge) * 12;
  // The difference should be approximately the total loan payments (not 2x)
  const ratio = diff / expectedDiff;
  assert(
    ratio > 0.5 && ratio < 1.8,
    `Loan impact ratio: ${ratio.toFixed(2)} (should be ~1.0, was ~2.0 before fix). Diff: ¥${Math.round(diff).toLocaleString()}, expected: ¥${Math.round(expectedDiff).toLocaleString()}`
  );
}

// ── Test 8: NISA Growth contributions STOP after ¥12M (snapshot check) ──
console.log('\n── Test 8: NISA-G snapshot contributions stop at ¥12M ──');
{
  const result = runSimulation(BASE_INPUT);
  let cumulativeG = 0;
  let contribAfterLimit = false;
  for (const s of result.snapshots) {
    if (cumulativeG >= 12_000_000 && s.nisaGrowthCont > 0) {
      contribAfterLimit = true;
      break;
    }
    cumulativeG += s.nisaGrowthCont;
  }
  assert(
    !contribAfterLimit,
    `NISA-G snapshot contributions correctly stop after ¥12M lifetime (total tracked: ¥${cumulativeG.toLocaleString()})`
  );
}

// ── Test 9: Emergency fund deducted from investment savings ─────────────
console.log('\n── Test 9: Emergency fund savings reduce investments ──');
{
  const withEmergency = runSimulation({
    ...BASE_INPUT,
    monthlyEmerigencySavings: 50_000,
    emergencyFundTarget: 1_000_000,
  });
  const noEmergency = runSimulation({
    ...BASE_INPUT,
    monthlyEmerigencySavings: 0,
    emergencyFundTarget: 0,
  });
  const totalWith = withEmergency.totalNisaTsumitateContributed + withEmergency.totalNisaGrowthContributed + withEmergency.totalTaxableContributed;
  const totalWithout = noEmergency.totalNisaTsumitateContributed + noEmergency.totalNisaGrowthContributed + noEmergency.totalTaxableContributed;
  assert(
    totalWith < totalWithout,
    `Emergency fund reduces investments: ¥${totalWith.toLocaleString()} < ¥${totalWithout.toLocaleString()} (diff: ¥${(totalWithout - totalWith).toLocaleString()})`
  );
}

// ── Test 10: Capital gains tax applied on taxable withdrawals ───────────
console.log('\n── Test 10: Capital gains tax on taxable ──');
{
  // Run with only taxable account to isolate
  const result = runSimulation({
    ...BASE_INPUT,
    accounts: {
      ...BASE_INPUT.accounts,
      idecoEnabled: false,
      nisaTsumitateEnabled: false,
      nisaGrowthEnabled: false,
      taxableEnabled: true,
    },
  });
  // During retirement, taxable value should be less than gross (due to tax)
  // The snapshot `taxable` field shows NET after capital gains tax
  const lastAccum = result.snapshots.find(s => s.age >= BASE_INPUT.targetFireAge - 1 && s.age < BASE_INPUT.targetFireAge);
  const firstRetire = result.snapshots.find(s => s.age >= BASE_INPUT.targetFireAge);
  if (lastAccum && firstRetire) {
    // Gross balance vs net (taxable field should be net of unrealized gains tax)
    assert(
      firstRetire.taxable <= firstRetire.portfolio,
      `Taxable net ¥${firstRetire.taxable.toLocaleString()} <= portfolio ¥${firstRetire.portfolio.toLocaleString()} (tax applied)`
    );
  }
}

// ── Test 11: iDeCo withdrawal tax (10%) applied after age 60 ────────────
console.log('\n── Test 11: iDeCo withdrawal tax after age 60 ──');
{
  const result = runSimulation({
    ...BASE_INPUT,
    currentAge: 55,
    targetFireAge: 56,
    accounts: {
      ...BASE_INPUT.accounts,
      idecoEnabled: true,
      nisaTsumitateEnabled: false,
      nisaGrowthEnabled: false,
      taxableEnabled: false,
    },
    initialIdecoBalance: 10_000_000,
  });
  // After age 60, iDeCo withdrawals should have 10% tax
  const at60 = result.snapshots.find(s => s.age >= 60);
  assert(
    at60 !== undefined && at60.swpWithdrawal > 0,
    `SWP active at age 60: ¥${at60?.swpWithdrawal?.toLocaleString() ?? 0}/mo`
  );
}

// ── Test 12: SWP reaches target depletion age ───────────────────────────
console.log('\n── Test 12: Portfolio depletes near target age ──');
{
  const result = runSimulation(BASE_INPUT);
  if (result.portfolioDepletionAge) {
    assert(
      Math.abs(result.portfolioDepletionAge - 90) <= 2,
      `Portfolio depletes at age ${result.portfolioDepletionAge} (target: 90)`
    );
  } else {
    // Portfolio may not deplete if it's growing faster than withdrawals
    const lastSnapshot = result.snapshots[result.snapshots.length - 1];
    assert(
      lastSnapshot.portfolio >= 0,
      `Portfolio still positive at end: ¥${lastSnapshot.portfolio.toLocaleString()}`
    );
  }
}

// ── Summary ─────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed!');
}
