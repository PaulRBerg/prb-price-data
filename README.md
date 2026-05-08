# prb-price-data

Historical price data in TSV format — forex and crypto closing rates organised by pair and year, for use in personal projects.

## Layout

Files live under `forex/` and `crypto/`, named `<BASE>_<QUOTE>_<YEAR>.tsv` with uppercase ISO 4217 / ticker codes. Each file has two tab-separated columns:

| Column | Description                      |
| ------ | -------------------------------- |
| date   | ISO 8601 date (`YYYY-MM-DD`)     |
| price  | Closing price of BASE/QUOTE pair |

Year files for older dates may be sparse — only the dates that have been explicitly fetched are present.

## Datasets

### Forex

- `forex/EUR_RON_2022.tsv`
- `forex/EUR_RON_2023.tsv`
- `forex/EUR_RON_2024.tsv`
- `forex/EUR_RON_2025.tsv`
- `forex/EUR_USD_2017.tsv`
- `forex/EUR_USD_2018.tsv`
- `forex/EUR_USD_2022.tsv`
- `forex/EUR_USD_2023.tsv`
- `forex/EUR_USD_2024.tsv`
- `forex/EUR_USD_2025.tsv`
- `forex/USD_RON_2017.tsv`
- `forex/USD_RON_2018.tsv`
- `forex/USD_RON_2022.tsv`
- `forex/USD_RON_2023.tsv`
- `forex/USD_RON_2024.tsv`
- `forex/USD_RON_2025.tsv`
- `forex/USD_RON_2026.tsv`

### Crypto

- `crypto/BTC_USD_2017.tsv`
- `crypto/BTC_USD_2018.tsv`
- `crypto/BTC_USD_2026.tsv`
- `crypto/ETH_USD_2017.tsv`
- `crypto/ETH_USD_2018.tsv`

## Sources

- Forex rates from [CurrencyFreaks](https://currencyfreaks.com)
- Crypto prices from [CoinGecko](https://coingecko.com)

## Links

- [Issues](https://github.com/PaulRBerg/prb-price-data/issues)

## Contributing

Contributions are welcome. See [`AGENTS.md`](AGENTS.md) for the dataset conventions, file format rules, and data-integrity guarantees.

## License

MIT — declared in `package.json`.
