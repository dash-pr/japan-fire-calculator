"use client";

import React, { useState, useMemo } from "react";
import {
  calculateKokuminNenkin,
  calculateEmployeeNenkin,
  calculateCombinedNenkin,
  formatNenkinOutput,
  NenkinOutput,
} from "@/lib/nenkinCalculator";
import { formatYen } from "@/lib/fireCalculator";

export default function NenkinPage() {
  // Kokumin nenkin inputs
  const [kokuminYears, setKokuminYears] = useState(40);
  const [kokuminEnabled, setKokuminEnabled] = useState(true);

  // Employee nenkin inputs
  const [employeeYears, setEmployeeYears] = useState(0);
  const [employeeEnabled, setEmployeeEnabled] = useState(false);
  const [averageSalary, setAverageSalary] = useState(500_000);

  // Common settings
  const [startAge, setStartAge] = useState(65);
  const [delayYears, setDelayYears] = useState(0);

  // Calculations
  const results = useMemo(() => {
    if (!kokuminEnabled && !employeeEnabled) {
      return null;
    }

    if (kokuminEnabled && !employeeEnabled) {
      return calculateKokuminNenkin(kokuminYears, startAge, delayYears);
    }

    if (employeeEnabled && !kokuminEnabled) {
      return calculateEmployeeNenkin(employeeYears, averageSalary, startAge, delayYears);
    }

    // Both enabled
    const combined = calculateCombinedNenkin(
      kokuminYears,
      employeeYears,
      averageSalary,
      startAge,
      delayYears
    );
    return combined.total;
  }, [kokuminEnabled, kokuminYears, employeeEnabled, employeeYears, averageSalary, startAge, delayYears]);

  const kokuminResult = useMemo(() => {
    if (!kokuminEnabled) return null;
    return calculateKokuminNenkin(kokuminYears, startAge, delayYears);
  }, [kokuminEnabled, kokuminYears, startAge, delayYears]);

  const employeeResult = useMemo(() => {
    if (!employeeEnabled) return null;
    return calculateEmployeeNenkin(employeeYears, averageSalary, startAge, delayYears);
  }, [employeeEnabled, employeeYears, averageSalary, startAge, delayYears]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Title */}
      <div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 32,
          fontWeight: 700,
          margin: 0,
          marginBottom: 4,
          color: "#111111",
        }}>
          Nenkin Calculator
        </h1>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 13,
          fontStyle: "italic",
          color: "#737373",
          margin: 0,
        }}>
          Calculate your estimated Japanese pension (nenkin) payout based on contribution years and delay options.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left: Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Common Settings */}
          <div style={{
            background: "rgba(17,17,17,0.04)",
            border: "1px solid rgba(17,17,17,0.1)",
            padding: "16px 18px",
            borderRadius: "2px",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#111111",
              marginBottom: 12,
            }}>
              Pension Start Settings
            </div>

            {/* Start Age */}
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "#737373",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}>
                <span>Start Age</span>
                <span>{startAge}</span>
              </label>
              <input
                type="range"
                min="60"
                max="75"
                step="1"
                value={startAge}
                onChange={(e) => setStartAge(Number(e.target.value))}
                style={{ width: "100%", cursor: "pointer" }}
              />
              <div style={{
                fontSize: 9,
                color: "#999999",
                marginTop: 4,
              }}>
                Standard age: 65. Starting earlier reduces payout by ~0.5% per year.
              </div>
            </div>

            {/* Delay Years */}
            <div>
              <label style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "#737373",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}>
                <span>Years Delayed</span>
                <span>{delayYears}</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={delayYears}
                onChange={(e) => setDelayYears(Number(e.target.value))}
                style={{ width: "100%", cursor: "pointer" }}
              />
              <div style={{
                fontSize: 9,
                color: "#999999",
                marginTop: 4,
              }}>
                Each year of delay increases payout by 8.4% (max +84% at 10 years).
              </div>
            </div>
          </div>

          {/* Kokumin Nenkin */}
          <div style={{
            background: "rgba(17,17,17,0.04)",
            border: "1px solid rgba(17,17,17,0.1)",
            padding: "16px 18px",
            borderRadius: "2px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={kokuminEnabled}
                onChange={(e) => setKokuminEnabled(e.target.checked)}
                style={{ accentColor: "#CC0000", cursor: "pointer", width: 18, height: 18 }}
              />
              <label style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: kokuminEnabled ? "#111111" : "#999999",
                cursor: "pointer",
                flex: 1,
              }}>
                国民年金 (Kokumin Nenkin)
              </label>
            </div>

            {kokuminEnabled && (
              <div>
                <label style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "#737373",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}>
                  <span>Contribution Years</span>
                  <span>{kokuminYears}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={kokuminYears}
                  onChange={(e) => setKokuminYears(Number(e.target.value))}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <div style={{
                  fontSize: 9,
                  color: "#999999",
                  marginTop: 4,
                }}>
                  Maximum 40 years. Minimum 25 years required for payment eligibility.
                </div>
              </div>
            )}
          </div>

          {/* Employee Nenkin */}
          <div style={{
            background: "rgba(17,17,17,0.04)",
            border: "1px solid rgba(17,17,17,0.1)",
            padding: "16px 18px",
            borderRadius: "2px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={employeeEnabled}
                onChange={(e) => setEmployeeEnabled(e.target.checked)}
                style={{ accentColor: "#CC0000", cursor: "pointer", width: 18, height: 18 }}
              />
              <label style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: employeeEnabled ? "#111111" : "#999999",
                cursor: "pointer",
                flex: 1,
              }}>
                厚生年金 (Employee Nenkin)
              </label>
            </div>

            {employeeEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: "#737373",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}>
                    <span>Contribution Years</span>
                    <span>{employeeYears}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    step="1"
                    value={employeeYears}
                    onChange={(e) => setEmployeeYears(Number(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </div>

                <div>
                  <label style={{
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: "#737373",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}>
                    Average Monthly Salary
                  </label>
                  <input
                    type="number"
                    value={averageSalary}
                    onChange={(e) => setAverageSalary(Number(e.target.value))}
                    min="0"
                    step="50000"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      background: "rgba(17,17,17,0.05)",
                      border: "1px solid rgba(17,17,17,0.1)",
                      color: "#111111",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{
                    fontSize: 9,
                    color: "#999999",
                    marginTop: 4,
                  }}>
                    Your average monthly salary during employment period.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Overall Results */}
          {results && (
            <div style={{
              background: "rgba(17,17,17,0.04)",
              border: "1px solid rgba(17,17,17,0.1)",
              padding: "20px 18px",
              borderRadius: "2px",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#111111",
                marginBottom: 16,
              }}>
                Estimated Nenkin Payout
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: "#737373",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}>
                    MONTHLY
                  </div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#4ECDC4",
                  }}>
                    {formatYen(results.monthlyAmount)}
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(17,17,17,0.15)" }} />

                <div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: "#737373",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}>
                    ANNUAL
                  </div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#4ECDC4",
                  }}>
                    {formatYen(results.annualAmount)}
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(17,17,17,0.15)" }} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: "#737373",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}>
                      START AGE
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111111",
                    }}>
                      {results.startAge}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: "#737373",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}>
                      DELAY BONUS
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#FFD700",
                    }}>
                      +{results.delayAdjustment.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown by Type */}
          {kokuminEnabled && kokuminResult && (
            <div style={{
              background: "rgba(65,105,225,0.1)",
              border: "1px solid rgba(65,105,225,0.3)",
              padding: "16px 18px",
              borderRadius: "2px",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#4169E1",
                marginBottom: 10,
              }}>
                国民年金 (Kokumin Nenkin)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#525252" }}>Monthly:</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>
                    {formatYen(kokuminResult.monthlyAmount)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#525252" }}>Annual:</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>
                    {formatYen(kokuminResult.annualAmount)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#525252" }}>Contribution years:</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>
                    {kokuminResult.totalContributionYears}
                  </span>
                </div>
              </div>
            </div>
          )}

          {employeeEnabled && employeeResult && (
            <div style={{
              background: "rgba(50,205,50,0.1)",
              border: "1px solid rgba(50,205,50,0.3)",
              padding: "16px 18px",
              borderRadius: "2px",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#32CD32",
                marginBottom: 10,
              }}>
                厚生年金 (Employee Nenkin)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#525252" }}>Monthly:</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>
                    {formatYen(employeeResult.monthlyAmount)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#525252" }}>Annual:</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>
                    {formatYen(employeeResult.annualAmount)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#525252" }}>Contribution years:</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>
                    {employeeResult.totalContributionYears}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {results && results.notes.length > 0 && (
            <div style={{
              background: "rgba(255,215,0,0.1)",
              border: "1px solid rgba(255,215,0,0.3)",
              padding: "12px 14px",
              borderRadius: "2px",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#FFD700",
                marginBottom: 8,
              }}>
                NOTES & DISCLAIMERS
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: 14,
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}>
                {results.notes.map((note, idx) => (
                  <li key={idx} style={{
                    fontSize: 9,
                    color: "#525252",
                    lineHeight: 1.4,
                  }}>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div style={{
        background: "rgba(17,17,17,0.04)",
        border: "1px solid rgba(17,17,17,0.1)",
        padding: "20px 18px",
        borderRadius: "2px",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#111111",
          marginBottom: 12,
        }}>
          About Nenkin (年金)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 600,
              color: "#4169E1",
              marginBottom: 8,
            }}>
              国民年金 (Kokumin Nenkin)
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: 16,
              fontSize: 11,
              color: "#525252",
              lineHeight: 1.6,
            }}>
              <li>Self-employed, freelancers, students (aged 20-60)</li>
              <li>Base amount: ¥68,100/month (2024)</li>
              <li>Maximum 40 years of contributions</li>
              <li>Minimum 25 years required to receive payment</li>
              <li>Can start receiving at age 60-75</li>
            </ul>
          </div>

          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 600,
              color: "#32CD32",
              marginBottom: 8,
            }}>
              厚生年金 (Employee Nenkin)
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: 16,
              fontSize: 11,
              color: "#525252",
              lineHeight: 1.6,
            }}>
              <li>Employees of companies</li>
              <li>Based on salary and contribution years</li>
              <li>Employer and employee share contributions (50/50)</li>
              <li>Can start receiving at age 60-65 (varies by birth year)</li>
              <li>Usually combined with Kokumin Nenkin</li>
            </ul>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(17,17,17,0.15)", margin: "16px 0" }} />

        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 600,
            color: "#FFD700",
            marginBottom: 8,
          }}>
            Delayed Pension (Kuriage Ukeyoke / 繰り上げ受給)
          </div>
          <p style={{
            margin: 0,
            fontSize: 11,
            color: "#525252",
            lineHeight: 1.6,
          }}>
            Each year of delay beyond age 65 increases your monthly payout by 8.4%, up to 84% additional at 10 years of delay. Conversely, starting before 65 reduces your payment proportionally.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        background: "rgba(255,0,0,0.05)",
        border: "1px solid rgba(255,0,0,0.2)",
        padding: "14px 16px",
        borderRadius: "2px",
        fontSize: 10,
        color: "#525252",
        lineHeight: 1.6,
      }}>
        <strong style={{ color: "#FF6B6B" }}>⚠ Disclaimer:</strong> This calculator provides rough estimates based on 2024 nenkin rates and simplified formulas. Actual nenkin payments may differ due to inflation adjustments, bonus calculations, and other factors. For accurate calculations, consult the official Nenkin Net website (nenkinet.mlit.go.jp) or Japan Pension Service.
      </div>
    </div>
  );
}
