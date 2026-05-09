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

| Pair    | Years available     |
| ------- | ------------------- |
| EUR/RON | 2022–2025           |
| EUR/USD | 2017–2019, 2022–2025 |
| GBP/USD | 2019                |
| USD/RON | 2017–2020, 2022–2026 |

### Crypto

| Pair    | Years available     |
| ------- | ------------------- |
| BTC/USD | 2017–2019, 2026     |
| ETH/USD | 2017–2019, 2025     |

## Sources

- Forex rates from [CurrencyFreaks](https://currencyfreaks.com)
- Crypto prices from [CoinGecko](https://coingecko.com)

## Links

- [Issues](https://github.com/PaulRBerg/prb-price-data/issues)

## Contributing

Contributions are welcome. See [`AGENTS.md`](AGENTS.md) for the dataset conventions, file format rules, and data-integrity guarantees.

## License

MIT — declared in `package.json`.
