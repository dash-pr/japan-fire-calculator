// ─────────────────────────────────────────────────────────────────
// Japan Nenkin (Pension) Calculator
// Supports Kokumin Nenkin and Employee Nenkin calculations
// ─────────────────────────────────────────────────────────────────

export type NenkinType = 'kokumin' | 'employee';

// 2024 nenkin base amounts (monthly, in yen)
export const NENKIN_2024 = {
  kokumin: {
    baseMonthly: 68_100, // Basic pension amount per month (2024)
    maxContributionYears: 40, // Maximum years of contribution
  },
  employee: {
    // Calculated based on average salary and contribution years
    // This will be adjusted based on actual earnings
  },
};

export interface NenkinInput {
  type: NenkinType;
  // Kokumin nenkin fields
  kokuminYears?: number; // Years contributed to kokumin nenkin
  // Employee nenkin fields
  employeeYears?: number; // Years contributed to employee nenkin
  averageSalary?: number; // Average monthly salary during employment (yen)
  // Delaying pension
  delayYears?: number; // Years delayed beyond normal start age (0-10, typically)
  startAge?: number; // Age to start taking nenkin (typically 60-75)
}

export interface NenkinOutput {
  type: NenkinType;
  monthlyAmount: number; // Monthly pension payout in yen
  annualAmount: number; // Annual pension payout in yen
  totalContributionYears: number; // Total years contributed
  startAge: number; // Age when pension starts
  delayYears: number; // Years delayed
  delayAdjustment: number; // Percentage increase due to delay (0-84%)
  notes: string[];
}

/**
 * Calculate Kokumin Nenkin (国民年金) monthly payout
 * Formula: (Contribution years / 40) × Base amount × Delay multiplier
 */
export function calculateKokuminNenkin(
  contributionYears: number,
  startAge: number = 65,
  delayYears: number = 0
): NenkinOutput {
  const notes: string[] = [];

  // Validate inputs
  if (contributionYears < 0 || contributionYears > 40) {
    notes.push(`Contribution years capped to 0-40 range (input: ${contributionYears})`);
  }
  const cappedYears = Math.max(0, Math.min(40, contributionYears));

  // Validate start age (can start from 60, typically 65)
  if (startAge < 60 || startAge > 75) {
    notes.push(`Start age adjusted to 60-75 range (input: ${startAge})`);
  }
  const validStartAge = Math.max(60, Math.min(75, startAge));

  // Validate delay years
  if (delayYears < 0 || delayYears > 10) {
    notes.push(`Delay years capped to 0-10 range (input: ${delayYears})`);
  }
  const cappedDelayYears = Math.max(0, Math.min(10, delayYears));

  // Calculate base monthly amount
  // Base: 68,100 yen × (contribution years / 40)
  const baseMonthly = NENKIN_2024.kokumin.baseMonthly;
  const contributionRatio = cappedYears / 40;
  const baseAmount = baseMonthly * contributionRatio;

  // Calculate delay multiplier
  // Each year of delay increases by 8.4% (max 84% at 10 years)
  const delayMultiplier = 1 + (cappedDelayYears * 0.084);
  const delayAdjustmentPercent = cappedDelayYears * 8.4;

  // Calculate final monthly amount
  const monthlyAmount = baseAmount * delayMultiplier;
  const annualAmount = monthlyAmount * 12;

  if (cappedYears < 25) {
    notes.push(
      `Minimum contribution requirement: At least 25 years needed for payment. Current: ${cappedYears} years`
    );
  }

  if (startAge < 65) {
    notes.push(
      `Early start (age ${validStartAge}): Reduces monthly payout by ${((65 - validStartAge) * 0.5).toFixed(1)}%`
    );
  }

  return {
    type: 'kokumin',
    monthlyAmount: Math.round(monthlyAmount),
    annualAmount: Math.round(annualAmount),
    totalContributionYears: cappedYears,
    startAge: validStartAge,
    delayYears: cappedDelayYears,
    delayAdjustment: delayAdjustmentPercent,
    notes,
  };
}

/**
 * Calculate Employee Nenkin (厚生年金) monthly payout
 * Formula: (Average salary × Contribution months / 627) × Delay multiplier
 *
 * Note: This is a simplified calculation. Actual calculations are more complex.
 * The factor of 627 represents a specific ratio used in official nenkin calculations.
 */
export function calculateEmployeeNenkin(
  employeeYears: number,
  averageSalary: number, // Monthly average salary in yen
  startAge: number = 65,
  delayYears: number = 0
): NenkinOutput {
  const notes: string[] = [];

  // Validate inputs
  if (employeeYears < 0 || employeeYears > 45) {
    notes.push(`Contribution years capped to 0-45 range (input: ${employeeYears})`);
  }
  const cappedYears = Math.max(0, Math.min(45, employeeYears));

  if (averageSalary < 0) {
    notes.push('Average salary cannot be negative, set to 0');
  }
  const validSalary = Math.max(0, averageSalary);

  // Validate start age
  if (startAge < 60 || startAge > 75) {
    notes.push(`Start age adjusted to 60-75 range (input: ${startAge})`);
  }
  const validStartAge = Math.max(60, Math.min(75, startAge));

  // Validate delay years
  if (delayYears < 0 || delayYears > 10) {
    notes.push(`Delay years capped to 0-10 range (input: ${delayYears})`);
  }
  const cappedDelayYears = Math.max(0, Math.min(10, delayYears));

  // Convert years to months for calculation
  const contributionMonths = cappedYears * 12;

  // Employee nenkin calculation factor (simplified)
  // Official formula: Average salary × Contribution months × 0.005481
  // (0.005481 ≈ 1/182.5, approximate factor for standard calculation)
  const baseFactor = 0.005481;
  const baseMonthly = validSalary * contributionMonths * baseFactor;

  // Apply delay multiplier (same as kokumin: 8.4% per year, max 84%)
  const delayMultiplier = 1 + (cappedDelayYears * 0.084);
  const delayAdjustmentPercent = cappedDelayYears * 8.4;

  // Calculate final monthly amount
  const monthlyAmount = baseMonthly * delayMultiplier;
  const annualAmount = monthlyAmount * 12;

  if (cappedYears < 1) {
    notes.push(
      'Employee nenkin requires at least 1 month of contributions'
    );
  }

  if (startAge < 65) {
    notes.push(
      `Early start (age ${validStartAge}): Reduces monthly payout by ${((65 - validStartAge) * 0.5).toFixed(1)}%`
    );
  }

  // Note about combined payout
  if (cappedYears > 0) {
    notes.push(
      'Employee nenkin is typically paid in addition to kokumin nenkin (if applicable)'
    );
  }

  return {
    type: 'employee',
    monthlyAmount: Math.round(monthlyAmount),
    annualAmount: Math.round(annualAmount),
    totalContributionYears: cappedYears,
    startAge: validStartAge,
    delayYears: cappedDelayYears,
    delayAdjustment: delayAdjustmentPercent,
    notes,
  };
}

/**
 * Calculate combined nenkin payout for someone with both kokumin and employee contributions
 */
export function calculateCombinedNenkin(
  kokuminYears: number,
  employeeYears: number,
  averageSalary: number,
  startAge: number = 65,
  delayYears: number = 0
): { kokumin: NenkinOutput; employee: NenkinOutput; total: NenkinOutput } {
  const kokumin = calculateKokuminNenkin(kokuminYears, startAge, delayYears);
  const employee = calculateEmployeeNenkin(employeeYears, averageSalary, startAge, delayYears);

  // Combined output
  const combined: NenkinOutput = {
    type: 'kokumin', // Just for reference
    monthlyAmount: kokumin.monthlyAmount + employee.monthlyAmount,
    annualAmount: kokumin.annualAmount + employee.annualAmount,
    totalContributionYears: Math.max(kokumin.totalContributionYears, employee.totalContributionYears),
    startAge,
    delayYears,
    delayAdjustment: (kokumin.delayAdjustment + employee.delayAdjustment) / 2,
    notes: [
      ...kokumin.notes,
      ...employee.notes,
      `Combined monthly payout: ¥${(kokumin.monthlyAmount + employee.monthlyAmount).toLocaleString()}`,
    ],
  };

  return { kokumin, employee, total: combined };
}

/**
 * Format nenkin output for display
 */
export function formatNenkinOutput(output: NenkinOutput): string {
  const lines: string[] = [
    `Type: ${output.type === 'kokumin' ? '国民年金 (Kokumin Nenkin)' : '厚生年金 (Employee Nenkin)'}`,
    `Contribution Years: ${output.totalContributionYears}`,
    `Start Age: ${output.startAge}`,
    `Delayed: ${output.delayYears} years (+${output.delayAdjustment.toFixed(1)}%)`,
    `Monthly Payout: ¥${output.monthlyAmount.toLocaleString()}`,
    `Annual Payout: ¥${output.annualAmount.toLocaleString()}`,
  ];

  if (output.notes.length > 0) {
    lines.push('');
    lines.push('Notes:');
    output.notes.forEach((note) => lines.push(`• ${note}`));
  }

  return lines.join('\n');
}
