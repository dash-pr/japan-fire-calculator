"use client";

export default function DocsPage() {
  return (
    <>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--n500)",
          marginBottom: 10,
          borderBottom: "4px solid var(--ink)",
          paddingBottom: 6,
        }}
      >
        Documentation
      </div>

      <div style={{ maxWidth: "900px" }}>
        {/* Getting Started */}
        <section style={{ marginBottom: 36 }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Getting Started
          </h2>
          <p style={{ color: "var(--n600)", lineHeight: 1.7, marginBottom: 12 }}>
            Enter your current age, target FIRE age, income, and monthly expenses in the left sidebar. The simulator updates in real time as you adjust inputs. Start with your baseline assumptions—age, current salary, and living costs. Then explore how different savings rates or investment returns affect your FIRE date.
          </p>
        </section>

        {/* Core Concepts */}
        <section style={{ marginBottom: 36 }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Core Concepts
          </h2>

          <h3
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink)",
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            Lean FIRE vs Fat FIRE
          </h3>
          <p style={{ color: "var(--n600)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--ink)" }}>Lean FIRE</strong> — Portfolio sized to cover your post-FIRE expenses using the 4% rule (4% annual withdrawal rate).
            <br />
            <strong style={{ color: "var(--ink)" }}>Fat FIRE</strong> — 1.5× Lean FIRE capital, providing a 50% safety buffer for market downturns or higher spending.
          </p>

          <h3
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink)",
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            SWP (Systematic Withdrawal Plan)
          </h3>
          <p style={{ color: "var(--n600)", lineHeight: 1.7 }}>
            Monthly income during retirement designed to deplete your portfolio to ¥0 at your chosen depletion age (default: 90). The simulator withdraws from taxable accounts first, then tax-free accounts. <strong>Tax-adjusted:</strong> Capital gains tax (~20%) on taxable withdrawals is automatically calculated and factored into the required capital calculations. The displayed withdrawal amount is the net amount you receive after tax impact. The withdrawal amount adjusts monthly to account for returns and inflation.
          </p>

          <h3
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink)",
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            Withdrawal Order
          </h3>
          <p style={{ color: "var(--n600)", lineHeight: 1.7 }}>
            During retirement, withdrawals follow this order: taxable accounts → NISA growth → NISA tsumitate → iDeCo (age 60+). This prioritizes tax-advantaged accounts, minimizing taxes paid.
          </p>
        </section>

        {/* Account Types */}
        <section style={{ marginBottom: 36 }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Account Types (Japan)
          </h2>

          <div style={{ marginBottom: 20 }}>
            <h3
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink)",
                marginTop: 0,
                marginBottom: 6,
              }}
            >
              iDeCo (Individualized Defined Contribution Pension Plan)
            </h3>
            <p style={{ color: "var(--n600)", lineHeight: 1.7, marginBottom: 6 }}>
              <strong>Limits:</strong> ¥68,000/month (freelancer) or ¥23,000/month (employee).
              <br />
              <strong>Tax benefit:</strong> ~20% income tax deduction on contributions. Withdrawals taxed at ~10%.
              <br />
              <strong>Access:</strong> Cannot withdraw before age 60. Tax benefit applied automatically in calculations.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink)",
                marginTop: 0,
                marginBottom: 6,
              }}
            >
              New NISA (2024)
            </h3>
            <p style={{ color: "var(--n600)", lineHeight: 1.7, marginBottom: 6 }}>
              <strong>Tsumitate slot:</strong> ¥1.2M/year, ¥6M lifetime. Lifetime limit reached in ~5 years.
              <br />
              <strong>Growth slot:</strong> ¥2.4M/year, ¥12M lifetime. Reached in ~5 years.
              <br />
              <strong>Tax benefit:</strong> Dividends and capital gains are completely tax-free.
              <br />
              <strong>Access:</strong> No withdrawal restrictions. Unlimited holding period.
            </p>
          </div>

          <div>
            <h3
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink)",
                marginTop: 0,
                marginBottom: 6,
              }}
            >
              Taxable Brokerage
            </h3>
            <p style={{ color: "var(--n600)", lineHeight: 1.7 }}>
              Leftover savings after iDeCo and NISA caps are reached. Capital gains tax ~20.315% applies on profits when withdrawn. No annual or lifetime limits.
            </p>
          </div>
        </section>

        {/* Key Assumptions */}
        <section style={{ marginBottom: 36 }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Key Assumptions
          </h2>

          <ul
            style={{
              color: "var(--n600)",
              lineHeight: 1.8,
              paddingLeft: 24,
              margin: 0,
            }}
          >
            <li>
              <strong>Annual return:</strong> Input value is nominal (includes inflation). Real return ≈ nominal return − inflation rate.
            </li>
            <li>
              <strong>Salary growth:</strong> Applied to pre-tax income during accumulation phase only. Post-FIRE, only side income grows with inflation.
            </li>
            <li>
              <strong>Inflation:</strong> Applied to both living expenses and investment returns (reduces real returns).
            </li>
            <li>
              <strong>Lifestyle inflation:</strong> Optional additional spending increase post-FIRE (e.g., travel more in retirement).
            </li>
            <li>
              <strong>Loans:</strong> Monthly payments reduce disposable income. Loan principal is reduced each month; remaining balance used to recalculate payment.
            </li>
            <li>
              <strong>Taxes on investments:</strong> iDeCo withdrawal tax ~10%, NISA growth/tsumitate tax-free, taxable capital gains tax ~20.315%.
            </li>
            <li>
              <strong>Contribution order:</strong> Income → iDeCo (up to limit) → NISA tsumitate (up to annual limit) → NISA growth (up to annual limit) → Taxable brokerage.
            </li>
            <li>
              <strong>Pension/Social Security:</strong> Input your expected pension as a monthly amount <strong>after taxes</strong>. The calculator treats pension as income that reduces required portfolio withdrawal amount. Use the Nenkin Calculator tab to estimate your Japanese pension payout.
            </li>
          </ul>
        </section>

        {/* Advanced Features */}
        <section style={{ marginBottom: 36 }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Advanced Features
          </h2>

          <h3
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink)",
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            Pension / Social Security
          </h3>
          <p style={{ color: "var(--n600)", lineHeight: 1.7 }}>
            Add expected pension income starting at a specific retirement age. <strong>Important:</strong> Enter pension amounts <strong>after-tax</strong>. The calculator does not deduct taxes from pension income; it assumes your input is already net of any applicable taxes. Include delayed pension bonuses if planning to take nenkin later than the standard age (e.g., age 70 instead of 65).
          </p>

          <h3
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink)",
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            Emergency Fund & Cash Savings
          </h3>
          <p style={{ color: "var(--n600)", lineHeight: 1.7 }}>
            Designate a portion of monthly savings toward an emergency fund. Set a monthly savings amount and a target fund size. Once the target is reached, remaining surplus goes to investments. Useful for maintaining 3–6 months of expenses in liquid savings before aggressive investing.
          </p>

          <h3
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink)",
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            Investment Allocation Strategy
          </h3>
          <p style={{ color: "var(--n600)", lineHeight: 1.7 }}>
            Choose how to prioritize tax-advantaged accounts during accumulation: <strong>Optimal</strong> (default) maximizes tax efficiency; <strong>Prioritize NISA</strong> maxes out NISA first; <strong>Prioritize iDeCo</strong> prioritizes iDeCo contributions; <strong>Equal Split</strong> divides surplus equally among enabled accounts. Strategy only applies if multiple account types are enabled.
          </p>

          <h3
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink)",
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            Nenkin Calculator
          </h3>
          <p style={{ color: "var(--n600)", lineHeight: 1.7 }}>
            Estimate your Japanese pension (nenkin) payout in the dedicated Nenkin tab. Input contribution years for Kokumin Nenkin (self-employed) and/or Employee Nenkin (corporate). Choose your start age (60–75) and apply delayed pension bonuses (+8.4% per year, max 84%). The calculator uses 2024 nenkin rates; consult Japan Pension Service for exact figures.
          </p>
        </section>

        {/* Tips */}
        <section>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Tips for Realistic Projections
          </h2>

          <ul
            style={{
              color: "var(--n600)",
              lineHeight: 1.8,
              paddingLeft: 24,
              margin: 0,
            }}
          >
            <li>Use conservative return assumptions (4–6%) rather than historical averages.</li>
            <li>Plan for a higher depletion age (90+) to account for longevity risk.</li>
            <li>Account for post-FIRE spending changes (travel, healthcare, hobbies).</li>
            <li>Include realistic loan terms for mortgages or major purchases.</li>
            <li>Review assumptions annually and adjust as circumstances change.</li>
            <li>This calculator is illustrative. Consult a financial advisor for major decisions.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
