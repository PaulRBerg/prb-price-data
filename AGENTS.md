# Context

Static historical price data in TSV format. No build system, no code — this repo is a dataset.

## Layout

- `forex/<BASE>_<QUOTE>_<YEAR>.tsv` — one file per currency pair per year
- `crypto/<BASE>_<QUOTE>_<YEAR>.tsv` — one file per crypto pair per year
- `downloads/` — gitignored scratch directory for raw upstream payloads pulled by the data skills
- `.env.example` — documents required API keys (`COINGECKO_API_KEY`, `CURRENCY_FREAKS_API_KEY`)
- `package.json` — package metadata only (no scripts, no dependencies)
- `README.md` — public-facing dataset description

## File Format

- Tab-separated values, **not** comma-separated
- First row is a header: `date\tprice`
- `date` is ISO 8601 (`YYYY-MM-DD`), one row per calendar day, ascending
- `price` is the closing rate of `BASE/QUOTE` (how many QUOTE per 1 BASE)
- No trailing newline games — keep a single trailing newline, Unix LF
- No thousands separators, no currency symbols, no quoted fields

## Naming

- Filenames use **uppercase ISO 4217 codes** (or ticker symbols for crypto) separated by underscores: `EUR_USD_2025.tsv`, `BTC_USD_2026.tsv`
- Directory names are lowercase and describe the asset class (`forex/`, `crypto/`, future: `stocks/`)
- One year per file; do not merge multi-year ranges

## Data Integrity

- Preserve historical values — never overwrite past rows when appending new dates
- When extending a year, append only; re-sort only if insertion is required
- For full-year backfills (current and recent years), verify row count matches elapsed days before committing (weekends included for forex via CurrencyFreaks)
- Sparse year files are acceptable for older dates fetched on demand — only the dates explicitly needed are required, full-year completeness is not enforced
- Cross-check a handful of dates against the upstream source before committing bulk updates

## Sources

- **Forex**: [CurrencyFreaks](https://currencyfreaks.com) — use the `api-currency-freaks` skill to pull rates
- **Crypto**: [CoinGecko](https://coingecko.com/) — use the `coingecko-cli` skill

## Workflow

Adding or extending a dataset:

1. Load the relevant API key from `.env` (`CURRENCY_FREAKS_API_KEY` for forex, `COINGECKO_API_KEY` for crypto).
2. Invoke the matching skill (`api-currency-freaks` or `coingecko-cli`) to fetch the date range you need.
3. Land raw responses in `downloads/` (gitignored) if intermediate caching helps.
4. Append rows to `<asset>/<BASE>_<QUOTE>_<YEAR>.tsv`, respecting the format and integrity rules above.
5. Spot-check a few dates against the upstream source.
6. Update the dataset list in `README.md` if you added a new file.

## Contribution Workflow

- Default branch: `main`
- Branch directly from `main` for changes; small data updates can land as direct commits, larger restructurings via PR
- Commit messages are conventional-commit style (`feat:`, `fix:`, `chore:`, `docs:`)
- Never edit historical rows — corrections to past values must be justified in the commit message

@README.md
