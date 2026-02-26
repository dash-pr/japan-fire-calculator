import { NextResponse } from "next/server";
import { FUND_RETURNS_FALLBACK } from "@/lib/fundReturnsFallback";

export const revalidate = 86400; // Cache for 24 hours on Vercel Edge

// Fund ticker → Yahoo Finance proxy
const FUND_TO_YAHOO: Record<string, string> = {
  AC: "ACWI", NIAW: "ACWI", VT: "ACWI", SBIVT: "ACWI", TAWARA: "ACWI", BAL8: "ACWI",
  SP5: "^GSPC", SBIS: "^GSPC", VTI: "^GSPC",
  "MSCI-W": "EFA", TWRDM: "EFA", NIEX: "EFA",
  EM: "EEM", SBIEM: "EEM",
  TOPIX: "1306.T", NSTX: "1306.T", TWRJP: "1306.T",
  NIKKEI: "^N225",
  JREIT1: "1343.T", JREIT2: "1343.T", JREIT3: "1343.T", JREIT4: "1343.T",
  GREIT1: "VNQI", GREIT2: "VNQI", GREIT3: "VNQI",
  "BOND-JP": "2510.T",
  "BOND-W": "IAGG", "BOND-WH": "IAGG",
  NDX: "^NDX", NXTNDX: "^NDX",
  VYM: "VYM",
  FANG: "FNGS",
};

// These tickers need USD→JPY FX adjustment
const USD_TICKERS = new Set([
  "ACWI", "^GSPC", "EFA", "EEM", "VNQI", "IAGG", "^NDX", "VYM", "FNGS",
]);

// All unique Yahoo Finance tickers to fetch
const YAHOO_TICKERS = [
  "ACWI", "^GSPC", "EFA", "EEM", "1306.T", "^N225",
  "1343.T", "VNQI", "2510.T", "IAGG", "^NDX",
  "VYM", "FNGS", "USDJPY=X",
];

async function fetchMonthlyPrices(ticker: string): Promise<number[]> {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 11 * 365 * 24 * 3600; // 11 years history
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${start}&period2=${now}&interval=1mo&events=history`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${ticker}: ${res.status}`);
  const json = await res.json();
  return (json?.chart?.result?.[0]?.indicators?.adjclose?.[0]?.adjclose ?? []).filter(Boolean);
}

function annualizedReturn(prices: number[], months: number): number {
  if (prices.length < months + 1) return 0;
  const end = prices[prices.length - 1];
  const start = prices[prices.length - 1 - months];
  return ((end / start) ** (12 / months) - 1) * 100;
}

function applyFX(usdReturn: number, fxReturn: number): number {
  return ((1 + usdReturn / 100) * (1 + fxReturn / 100) - 1) * 100;
}

export async function GET() {
  try {
    // --- Fetch fresh ---
    const priceMap: Record<string, number[]> = {};
    await Promise.allSettled(
      YAHOO_TICKERS.map(async (t) => {
        try {
          priceMap[t] = await fetchMonthlyPrices(t);
        } catch {
          priceMap[t] = [];
        }
      })
    );

    const fx = priceMap["USDJPY=X"] ?? [];
    const fxRet = {
      r1: annualizedReturn(fx, 12),
      r3: annualizedReturn(fx, 36),
      r5: annualizedReturn(fx, 60),
      r10: annualizedReturn(fx, 120),
    };

    const returns: Record<
      string,
      { return1y: number; return3y: number; return5y: number; return10y: number }
    > = {};

    for (const [fund, yahoo] of Object.entries(FUND_TO_YAHOO)) {
      const p = priceMap[yahoo] ?? [];
      if (p.length < 13) continue;
      const isUsd = USD_TICKERS.has(yahoo);
      const adjust = (v: number, f: number) => (isUsd ? applyFX(v, f) : v);

      returns[fund] = {
        return1y: adjust(annualizedReturn(p, 12), fxRet.r1),
        return3y: adjust(annualizedReturn(p, 36), fxRet.r3),
        return5y: adjust(annualizedReturn(p, 60), fxRet.r5),
        return10y: adjust(annualizedReturn(p, 120), fxRet.r10),
      };
    }

    // If we got decent data, return it as fresh
    if (Object.keys(returns).length > 15) {
      return NextResponse.json(
        {
          data: returns,
          meta: {
            fetchedAt: Date.now(),
            isStale: false,
            source: "yahoo-finance",
          },
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
          },
        }
      );
    }

    // Fallback if fetch didn't return enough data
    return NextResponse.json(
      {
        data: FUND_RETURNS_FALLBACK,
        meta: {
          fetchedAt: Date.now(),
          isStale: true,
          source: "fallback",
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Fund returns fetch error:", error);

    // Return fallback data with stale flag
    return NextResponse.json(
      {
        data: FUND_RETURNS_FALLBACK,
        meta: {
          fetchedAt: Date.now(),
          isStale: true,
          source: "fallback",
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  }
}
