import { SimulationInput } from "./fireCalculator";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateSimulationInput(
  input: SimulationInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Age constraints
  if (input.currentAge < 18 || input.currentAge > 90) {
    errors.push({
      field: "currentAge",
      message: "Current age must be between 18 and 90",
    });
  }

  if (
    input.targetFireAge <= input.currentAge ||
    input.targetFireAge > 100
  ) {
    errors.push({
      field: "targetFireAge",
      message: `FIRE age must be between ${input.currentAge + 1} and 100`,
    });
  }

  // Financial constraints - all amounts must be non-negative
  if (input.currentMonthlyIncome < 0) {
    errors.push({
      field: "monthlyIncome",
      message: "Monthly income cannot be negative",
    });
  }

  if (input.monthlyExpenses < 0) {
    errors.push({
      field: "monthlyExpenses",
      message: "Monthly expenses cannot be negative",
    });
  }

  if (input.postFireMonthlyExpenses < 0) {
    errors.push({
      field: "postFireMonthlyExpenses",
      message: "Post-FIRE expenses cannot be negative",
    });
  }

  if ((input.postFireMonthlyIncome ?? 0) < 0) {
    errors.push({
      field: "postFireMonthlyIncome",
      message: "Post-FIRE income cannot be negative",
    });
  }

  if ((input.postFatfireMonthlyIncome ?? 0) < 0) {
    errors.push({
      field: "postFatfireMonthlyIncome",
      message: "Post-FATFIRE income cannot be negative",
    });
  }

  // Rate constraints
  if (input.salaryIncreaseRate < 0 || input.salaryIncreaseRate > 20) {
    errors.push({
      field: "salaryIncreaseRate",
      message: "Salary increase rate must be between 0% and 20%",
    });
  }

  if (input.annualInflation < 0 || input.annualInflation > 20) {
    errors.push({
      field: "annualInflation",
      message: "Inflation must be between 0% and 20%",
    });
  }

  if (input.annualReturn < -10 || input.annualReturn > 25) {
    errors.push({
      field: "annualReturn",
      message: "Annual return must be between -10% and 25%",
    });
  }

  if (input.lifestyleInflation < 0 || input.lifestyleInflation > 20) {
    errors.push({
      field: "lifestyleInflation",
      message: "Lifestyle inflation must be between 0% and 20%",
    });
  }

  // Portfolio balances - all must be non-negative
  if ((input.initialIdecoBalance ?? 0) < 0) {
    errors.push({
      field: "initialIdecoBalance",
      message: "iDeCo balance cannot be negative",
    });
  }

  if ((input.initialNisaTsumitateBalance ?? 0) < 0) {
    errors.push({
      field: "initialNisaTsumitateBalance",
      message: "NISA tsumitate balance cannot be negative",
    });
  }

  if ((input.initialNisaGrowthBalance ?? 0) < 0) {
    errors.push({
      field: "initialNisaGrowthBalance",
      message: "NISA growth balance cannot be negative",
    });
  }

  if ((input.initialTaxableBalance ?? 0) < 0) {
    errors.push({
      field: "initialTaxableBalance",
      message: "Taxable balance cannot be negative",
    });
  }

  if ((input.juniorNisaBalance ?? 0) < 0) {
    errors.push({
      field: "juniorNisaBalance",
      message: "Junior NISA balance cannot be negative",
    });
  }

  // SWP depletion age
  if (
    (input.swpDepletionAge ?? 90) < input.targetFireAge ||
    (input.swpDepletionAge ?? 90) > 120
  ) {
    errors.push({
      field: "swpDepletionAge",
      message: `Portfolio depletion age must be after FIRE age (${input.targetFireAge}) and at most 120`,
    });
  }

  // Validate loans
  if (input.loans && input.loans.length > 0) {
    input.loans.forEach((loan, idx) => {
      if (loan.principal < 0) {
        errors.push({
          field: `loan-${idx}-principal`,
          message: `Loan "${loan.label}": principal cannot be negative`,
        });
      }
      if (loan.remainingMonths < 0) {
        errors.push({
          field: `loan-${idx}-remainingMonths`,
          message: `Loan "${loan.label}": remaining months cannot be negative`,
        });
      }
      if (loan.annualInterestRate < 0 || loan.annualInterestRate > 50) {
        errors.push({
          field: `loan-${idx}-rate`,
          message: `Loan "${loan.label}": interest rate must be between 0% and 50%`,
        });
      }
    });
  }

  // Validate pension
  if (input.pensionEnabled) {
    if ((input.pensionStartAge ?? 65) < input.currentAge) {
      errors.push({
        field: "pensionStartAge",
        message: "Pension start age must be >= current age",
      });
    }
    if ((input.pensionStartAge ?? 65) > 100) {
      errors.push({
        field: "pensionStartAge",
        message: "Pension start age must be <= 100",
      });
    }
    if ((input.pensionMonthlyAmount ?? 0) < 0) {
      errors.push({
        field: "pensionMonthlyAmount",
        message: "Pension amount cannot be negative",
      });
    }
  }

  // Validate emergency fund savings
  if ((input.monthlyEmerigencySavings ?? 0) < 0) {
    errors.push({
      field: "monthlyEmerigencySavings",
      message: "Monthly emergency savings cannot be negative",
    });
  }

  if ((input.emergencyFundTarget ?? 0) < 0) {
    errors.push({
      field: "emergencyFundTarget",
      message: "Emergency fund target cannot be negative",
    });
  }

  // Check if emergency fund savings exceed disposable income
  const disposableIncome = input.currentMonthlyIncome - input.monthlyExpenses;
  if ((input.monthlyEmerigencySavings ?? 0) > disposableIncome) {
    errors.push({
      field: "monthlyEmerigencySavings",
      message: `Monthly emergency savings (¥${input.monthlyEmerigencySavings?.toLocaleString()}) cannot exceed disposable income (¥${Math.max(0, disposableIncome).toLocaleString()})`,
    });
  }

  return errors;
}
