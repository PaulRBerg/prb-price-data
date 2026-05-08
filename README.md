# prb-price-data

Historical price data in TSV format.

## Layout

```
forex/
  <BASE>_<QUOTE>_<YEAR>.tsv
crypto/
  <BASE>_<QUOTE>_<YEAR>.tsv
```

Each file has two tab-separated columns:

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
