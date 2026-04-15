---
name: api-currency-freaks
description: This skill should be used when the user asks to "fetch FX rates", "get forex rates", "historical forex rates", "update forex TSV", quote a currency pair (e.g. "EUR/USD", "GBP/JPY", "RON/USD"), or mentions CurrencyFreaks API, daily exchange rates, or currency conversion.
---

# CurrencyFreaks API

## Overview

Fetch daily foreign exchange rates from the [CurrencyFreaks API](https://currencyfreaks.com/).
Use this skill for any currency pair supported by the API — the examples below
use EUR, USD, and RON, but the math and patterns generalize to any symbols
(GBP, JPY, CHF, etc.).

## Prerequisites

### API Key

The API key MUST be read from the `.env` file at the root of the repo as
`CURRENCY_FREAKS_API_KEY`. Do not hardcode it, do not echo it, do not commit it.

Validate before making any request:

```bash
set -a; . ./.env; set +a
if [ -z "$CURRENCY_FREAKS_API_KEY" ]; then
  echo "Error: CURRENCY_FREAKS_API_KEY is not set in .env"
  echo "Get a key at: https://currencyfreaks.com/"
  exit 1
fi
```

If the key is missing, halt and inform the user. Do not attempt to call the API without it.

### Plan Requirements

- `/rates/latest` — available on all plans (including free).
- `/rates/historical` — **paid plans only**. If the user requests historical data
  and the API returns an auth/plan error, surface it verbatim instead of guessing.
- `/timeseries` — **Professional plan and onwards only**. Batch historical rates
  across a date range in a single call. Prefer this over iterating
  `/rates/historical` day-by-day when the plan allows.

## Base URL

```
https://api.currencyfreaks.com/v2.0
```

## Semantics — read this before computing pairs

The default `base` is **USD**. A response looks like:

```json
{
  "base": "USD",
  "date": "2025-02-01 00:00:00+00",
  "rates": {
    "EUR": "0.9612",
    "RON": "4.7823",
    "GBP": "0.8021",
    ...
  }
}
```

With `base=USD`, each entry in `rates` is "symbol per 1 USD" (i.e. the USD→symbol
rate). Forex quoting convention for `XXX/YYY` is "YYY per 1 XXX". From a
USD-based response, any pair can be derived:

| Pair shape | Formula (with `base=USD`)         | Meaning                        |
| ---------- | --------------------------------- | ------------------------------ |
| `USD/YYY`  | `rates.YYY`                       | YYY per 1 USD (direct)         |
| `XXX/USD`  | `1 / rates.XXX`                   | USD per 1 XXX (inverse)        |
| `XXX/YYY`  | `rates.YYY / rates.XXX`           | YYY per 1 XXX (cross rate)     |

Worked examples:

- `EUR/USD` = `1 / rates.EUR`
- `RON/USD` = `1 / rates.RON`
- `EUR/RON` = `rates.RON / rates.EUR`
- `GBP/JPY` = `rates.JPY / rates.GBP`

When computing multiple pairs for the same date, request all needed symbols in
a **single** call via `symbols=EUR,RON,GBP,...`. This costs one API credit
instead of N and guarantees all rates come from the same snapshot, so cross
rates are internally consistent.

Alternatively, set `base=XXX` to have the API quote everything against `XXX`
directly — but confirm your plan supports a non-USD base before relying on it.

## Latest Rates

### Endpoint

```
GET /v2.0/rates/latest
```

| Parameter | Required | Value                                                    |
| --------- | -------- | -------------------------------------------------------- |
| `apikey`  | Yes      | `$CURRENCY_FREAKS_API_KEY`                               |
| `symbols` | No       | Comma-separated symbols (restrict to what you need)      |
| `base`    | No       | Three-letter code; omit to use default USD               |

### Example

```bash
curl -s "https://api.currencyfreaks.com/v2.0/rates/latest?apikey=$CURRENCY_FREAKS_API_KEY&symbols=EUR,RON,GBP"
```

## Historical Rates

### Endpoint

```
GET /v2.0/rates/historical
```

| Parameter | Required | Value                                      |
| --------- | -------- | ------------------------------------------ |
| `apikey`  | Yes      | `$CURRENCY_FREAKS_API_KEY`                 |
| `date`    | Yes      | `YYYY-MM-DD` (UTC)                         |
| `symbols` | No       | Comma-separated symbols                    |
| `base`    | No       | Three-letter code; omit to use default USD |

### Example

```bash
curl -s "https://api.currencyfreaks.com/v2.0/rates/historical?apikey=$CURRENCY_FREAKS_API_KEY&date=2025-02-01&symbols=EUR,RON,GBP"
```

### Date Rules

- Dates are UTC.
- Never request a future date — it will error or return the latest snapshot.
- For the current month, only fetch up to **yesterday** (today's close isn't final).
- Rates are daily closing prices at 00:00 UTC.
- CurrencyFreaks has data for most currencies since 1984-11-28.

## Time Series (Batch Historical Rates)

Use this to pull many days in **one** request instead of looping
`/rates/historical`. It costs one API credit for the whole range, avoids
per-day throttling, and guarantees all dates come from one coherent response.

### Endpoint

```
GET /v2.0/timeseries
```

| Parameter   | Required | Value                                                    |
| ----------- | -------- | -------------------------------------------------------- |
| `apikey`    | Yes      | `$CURRENCY_FREAKS_API_KEY`                               |
| `startDate` | Yes      | `YYYY-MM-DD` (UTC, inclusive)                            |
| `endDate`   | Yes      | `YYYY-MM-DD` (UTC, inclusive)                            |
| `symbols`   | No       | Comma-separated symbols (restrict to what you need)      |
| `base`      | No       | Three-letter code; omit to use default USD               |

### Example

```bash
curl -s "https://api.currencyfreaks.com/v2.0/timeseries?apikey=$CURRENCY_FREAKS_API_KEY&startDate=2025-02-01&endDate=2025-02-07&symbols=EUR,RON,GBP"
```

### Response Shape

```json
{
  "startDate": "2025-02-01",
  "endDate": "2025-02-07",
  "base": "USD",
  "historicalRatesList": [
    { "date": "2025-02-01", "rates": { "EUR": "0.9612", "RON": "4.7823", "GBP": "0.8021" } },
    { "date": "2025-02-02", "rates": { "EUR": "0.9608", "RON": "4.7811", "GBP": "0.8015" } },
    ...
  ]
}
```

Each `historicalRatesList[i].rates` map follows the same "symbol per 1 base"
semantics as `/rates/historical`, so the pair formulas in the table above apply
unchanged — iterate over the list and compute per-date pairs.

### When to use which endpoint

| Use case                                  | Endpoint              |
| ----------------------------------------- | --------------------- |
| Single date                               | `/rates/historical`   |
| Contiguous range of dates (backfill, TSV) | `/timeseries`         |
| Sparse / non-contiguous dates             | `/rates/historical`   |
| Plan is below Professional                | `/rates/historical`   |

### Date Rules

- Same UTC rules as `/rates/historical`: no future dates, use yesterday as the
  latest valid `endDate`, 00:00 UTC closing prices, data back to 1984-11-28.
- `startDate <= endDate`. If they're equal, the response still wraps a single
  entry in `historicalRatesList` — handle it the same way.
- The docs don't publish an explicit max range. If a large range errors or
  truncates, chunk into shorter windows (e.g. 1-year chunks) rather than
  falling back to per-day calls.

## Computing Pairs

Given a response `r` with USD base:

```ts
const rate = (sym: string) => {
  const v = Number(r.rates[sym]);
  if (!Number.isFinite(v) || v <= 0) {
    throw new Error(`Invalid or missing rate for ${sym}`);
  }
  return v;
};

// USD/YYY — direct
const usdYyy = rate("YYY");

// XXX/USD — inverse
const xxxUsd = 1 / rate("XXX");

// XXX/YYY — cross rate
const xxxYyy = rate("YYY") / rate("XXX");
```

Validate each value before using it:

- Must be a finite `Number`, not `NaN`.
- Must be `> 0`.
- If invalid, skip that date and warn — do not silently write a zero or NaN.

### Precision

Round to **4 decimal places** for storage, matching the existing forex TSVs:

```ts
const truncate4 = (n: number) => Math.round(n * 10_000) / 10_000;
```

Do the rounding only at the point of storage/display. Keep full precision while
computing cross rates from the raw symbol rates.

Note: 4 decimals is a reasonable default but may be insufficient for very
low-value pairs (e.g. `XXX/JPY` where the quote is ~0.0067 and needs more
precision, or `XXX/IDR` for similar reasons). Pick a precision that preserves
at least 4 significant figures for the specific pair.

## Storage Format (TSV)

If storing to a TSV in `forex/`, match the existing convention:

```tsv
id	output
"2025-02-01"	1.0404
"2025-02-02"	1.0421
```

- `id`: ISO date `YYYY-MM-DD` wrapped in double quotes.
- `output`: decimal number with consistent precision for the pair.
- Sorted chronologically, no duplicate dates.
- One file per pair, named `XXX_YYY.tsv` (e.g. `EUR_USD.tsv`, `GBP_JPY.tsv`).

## Rate Limiting & Retries

Free tier is tight. When iterating over a date range:

- Prefer `/timeseries` to collapse the whole range into one request — it sidesteps
  per-day throttling entirely. Only fall back to per-day `/rates/historical`
  calls if the plan doesn't cover `/timeseries` or the dates are non-contiguous.
- For per-day calls, sleep **500 ms** between requests.
- Retry on `429` and `5xx` with exponential backoff (1s, 2s, 4s; max 3 retries).
- On `401`/`403`, stop immediately — it's a key or plan problem, not transient.

## Error Handling

| Status / Body                              | Meaning                          | Action                                  |
| ------------------------------------------ | -------------------------------- | --------------------------------------- |
| `401` / `{"error": "Invalid API Key"}`     | Bad or missing key               | Stop. Ask user to check `.env`.         |
| `403` / plan restriction message           | Historical on free tier, etc.    | Stop. Surface the exact message.        |
| `429`                                      | Rate limited                     | Backoff and retry.                      |
| `5xx`                                      | Transient                        | Retry with backoff.                     |
| `200` but a requested symbol missing       | Symbol unavailable for that date | Skip date, warn.                        |

Never invent a fallback rate. If a date fails, omit it and report it.

## Output Formatting

**Default:** Markdown table for ad-hoc queries, with one column per requested pair:

```markdown
| Date       | EUR/USD | RON/USD | EUR/RON |
| ---------- | ------- | ------- | ------- |
| 2025-02-01 | 1.0404  | 0.2091  | 4.9748  |
```

**User preference:** If the user asks for JSON, CSV, TSV, or writes-to-file,
use that format instead. When writing to the repo's `forex/` directory, always
use the TSV format described above.

## Reference Files

- **`./references/example-client.ts`** — TypeScript reference implementation
  showing axios + retry, date iteration, and generic pair computation for any
  set of symbols.

## Fallback Documentation

For endpoints not covered here (fluctuation, convert, IP-to-currency, XML
format, etc.), fetch the official docs:

```
https://currencyfreaks.com/documentation.html
```

Use `WebFetch` to retrieve extended API capabilities on demand — do not guess
parameter names or response shapes.
