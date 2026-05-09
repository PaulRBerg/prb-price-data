/**
 * Reference client for the CurrencyFreaks API.
 *
 * Generic over symbols — callers pass the symbols they need and the pairs they
 * want derived. Loads CURRENCY_FREAKS_API_KEY from the repo-root .env (via
 * dotenv or a process manager that injects it). Retries on 429/5xx with
 * exponential backoff. Per-day historical calls run with bounded concurrency
 * and a small inter-launch delay.
 *
 * Adapted from ~/sablier/price-data/src/cli/fetch-forex/currencyfreaks-client.ts.
 */

import axios from "axios";
import axiosRetry from "axios-retry";

const BASE_URL = "https://api.currencyfreaks.com/v2.0";
const REQUEST_DELAY_MS = 75;
const CONCURRENCY = 4;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

type CurrencyFreaksResponse = {
  base: string;
  date: string;
  rates: Record<string, string>;
};

type CurrencyFreaksTimeseriesResponse = {
  base: string;
  startDate: string;
  endDate: string;
  historicalRatesList: Array<{ date: string; rates: Record<string, string> }>;
};

/** A pair to derive from a USD-based response, e.g. { from: "EUR", to: "USD" } = EUR/USD. */
export type Pair = { from: string; to: string };

export type PairQuotes = {
  date: string; // YYYY-MM-DD
  quotes: Record<string, number>; // key: "XXX/YYY", value: YYY per 1 XXX
};

const client = axios.create();

axiosRetry(client, {
  retries: MAX_RETRIES,
  retryDelay: (n) => RETRY_BASE_MS * 2 ** (n - 1),
  retryCondition: (error) => {
    if (axiosRetry.isNetworkOrIdempotentRequestError(error)) return true;
    const status = error.response?.status ?? 0;
    return status === 429 || status >= 500;
  },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getApiKey(): string {
  const key = process.env.CURRENCY_FREAKS_API_KEY;
  if (!key) {
    throw new Error("CURRENCY_FREAKS_API_KEY is not set in .env");
  }
  return key;
}

/** Returns "symbol per 1 USD" from a USD-based response. */
function usdRate(rates: Record<string, string>, symbol: string): number {
  if (symbol === "USD") return 1;
  const v = Number(rates[symbol]);
  if (!Number.isFinite(v) || v <= 0) {
    throw new Error(`Invalid or missing rate for ${symbol}`);
  }
  return v;
}

/**
 * Compute YYY per 1 XXX from a USD-based response.
 *
 * - USD/YYY = rates.YYY
 * - XXX/USD = 1 / rates.XXX
 * - XXX/YYY = rates.YYY / rates.XXX
 */
function computePair(rates: Record<string, string>, { from, to }: Pair): number {
  if (from === to) return 1;
  const fromUsd = usdRate(rates, from); // from per 1 USD
  const toUsd = usdRate(rates, to); // to per 1 USD
  return toUsd / fromUsd;
}

function pairKey({ from, to }: Pair): string {
  return `${from}/${to}`;
}

/** Union of all non-USD symbols referenced by the pairs, ready for ?symbols=. */
function symbolsParam(pairs: Pair[]): string {
  const set = new Set<string>();
  for (const { from, to } of pairs) {
    if (from !== "USD") set.add(from);
    if (to !== "USD") set.add(to);
  }
  return Array.from(set).join(",");
}

export async function fetchLatest(pairs: Pair[]): Promise<PairQuotes> {
  const apikey = getApiKey();
  const { data } = await client.get<CurrencyFreaksResponse>(`${BASE_URL}/rates/latest`, {
    params: { apikey, symbols: symbolsParam(pairs) },
  });

  const quotes: Record<string, number> = {};
  for (const pair of pairs) {
    quotes[pairKey(pair)] = computePair(data.rates, pair);
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    quotes,
  };
}

export async function fetchHistorical(date: string, pairs: Pair[]): Promise<PairQuotes | null> {
  const apikey = getApiKey();
  try {
    const { data } = await client.get<CurrencyFreaksResponse>(`${BASE_URL}/rates/historical`, {
      params: { apikey, date, symbols: symbolsParam(pairs) },
    });
    const quotes: Record<string, number> = {};
    for (const pair of pairs) {
      quotes[pairKey(pair)] = computePair(data.rates, pair);
    }
    return { date, quotes };
  } catch {
    return null;
  }
}

/**
 * Batch-fetch a contiguous date range in one request via /timeseries.
 *
 * Requires Professional plan or higher. One API credit per call, and all dates
 * come from a single coherent snapshot, so cross rates stay consistent within
 * each day.
 */
export async function fetchTimeseries(
  startDate: string,
  endDate: string,
  pairs: Pair[],
): Promise<PairQuotes[]> {
  const apikey = getApiKey();
  const { data } = await client.get<CurrencyFreaksTimeseriesResponse>(`${BASE_URL}/timeseries`, {
    params: { apikey, startDate, endDate, symbols: symbolsParam(pairs) },
  });

  return data.historicalRatesList.map(({ date, rates }) => {
    const quotes: Record<string, number> = {};
    for (const pair of pairs) {
      quotes[pairKey(pair)] = computePair(rates, pair);
    }
    return { date, quotes };
  });
}

/**
 * Iterate a date range inclusively via per-day /rates/historical calls.
 *
 * Fallback for plans without /timeseries access or for sparse date sets.
 * Runs up to CONCURRENCY requests in parallel with a small inter-launch delay
 * to spread load. Results are returned in chronological order.
 */
export async function fetchHistoricalRange(
  startDate: string,
  endDate: string,
  pairs: Pair[],
): Promise<PairQuotes[]> {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  const day = 24 * 60 * 60 * 1000;

  const dates: string[] = [];
  for (let t = start; t <= end; t += day) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }

  const results: Array<PairQuotes | null> = new Array(dates.length).fill(null);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= dates.length) return;
      results[i] = await fetchHistorical(dates[i], pairs);
      if (cursor < dates.length) await sleep(REQUEST_DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results.filter((r): r is PairQuotes => r !== null);
}
