# prb-price-data

Historical price data in TSV format.

## Layout

```
forex/
  <BASE>_<QUOTE>_<YEAR>.tsv
```

Each file has two tab-separated columns:

| Column | Description                      |
| ------ | -------------------------------- |
| date   | ISO 8601 date (`YYYY-MM-DD`)     |
| price  | Closing price of BASE/QUOTE pair |

## Datasets

- `forex/EUR_RON_2025.tsv`
- `forex/EUR_USD_2025.tsv`
- `forex/USD_RON_2025.tsv`

## Source

Forex rates are sourced from [CurrencyFreaks](https://currencyfreaks.com).
