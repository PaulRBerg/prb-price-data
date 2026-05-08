# Context

Static historical price data in TSV format. No build system, no code — this repo is a dataset.

## Layout

- `forex/<BASE>_<QUOTE>_<YEAR>.tsv` — one file per currency pair per year
- `.env.example` — documents required API keys (`COINGECKO_API_KEY`, `CURRENCY_FREAKS_API_KEY`)
- `README.md` — public-facing dataset description

## File Format

- Tab-separated values, **not** comma-separated
- First row is a header: `date\tprice`
- `date` is ISO 8601 (`YYYY-MM-DD`), one row per calendar day, ascending
- `price` is the closing rate of `BASE/QUOTE` (how many QUOTE per 1 BASE)
- No trailing newline games — keep a single trailing newline, Unix LF
- No thousands separators, no currency symbols, no quoted fields

## Naming

- Filenames use **uppercase ISO 4217 codes** separated by underscores: `EUR_USD_2025.tsv`
- Directory names are lowercase and describe the asset class (`forex/`, future: `crypto/`, `stocks/`)
- One year per file; do not merge multi-year ranges

## Data Integrity

- Preserve historical values — never overwrite past rows when appending new dates
- When extending a year, append only; re-sort only if insertion is required
- For full-year backfills (current and recent years), verify row count matches elapsed days before committing (weekends included for forex via CurrencyFreaks)
- Sparse year files are acceptable for older dates fetched on demand — only the dates explicitly needed are required, full-year completeness is not enforced
- Cross-check a handful of dates against the upstream source before committing bulk updates

## Sources

- **Forex**: [CurrencyFreaks](https://currencyfreaks.com) — use the `api-currency-freaks` skill to pull rates
- **Crypto** [CoinGecko](https://coingecko.com/) — use the `coingecko-api` skill

@README.md
