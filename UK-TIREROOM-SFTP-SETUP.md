# Omni Terrain UK — TireRoom SFTP activation

## Current state

- Market: UK only
- Staged tyre references: 351
- Live SFTP connected: no
- Live supplier price: disabled
- Live supplier stock: disabled
- Tyre checkout: disabled
- Sample supplier price / sample stock: never publish or use for checkout

The staged catalogue contains product identity and customer-safe specification fields only. Commercial sample fields from the supplier demo file are intentionally excluded from the public staging data.

## Credentials

Do not commit SFTP credentials, passwords, private keys, or connection strings to this repository and do not place them in browser JavaScript.

When the live feed is supplied, keep connection values server-side only. Expected configuration names for the integration are:

- `TIREROOM_SFTP_HOST`
- `TIREROOM_SFTP_PORT`
- `TIREROOM_SFTP_USERNAME`
- `TIREROOM_SFTP_PASSWORD` or a private-key secret
- `TIREROOM_SFTP_REMOTE_PATH`
- `TIREROOM_SFTP_FILENAME` if the remote path is a directory

## Activation sequence

1. Confirm host, port, username, authentication method and remote path/filename.
2. Perform a read-only test connection and download one live supplier file server-side.
3. Validate encoding, delimiter, headers and row count before importing anything.
4. Map live SKU/product identity to the 351 staged references. Unknown SKUs must not silently overwrite known items.
5. Identify the real supplier cost/price and stock fields from the live feed. Do not infer them from the demo file.
6. Validate numeric values, currency and stock semantics. Reject malformed, negative or obviously invalid values.
7. Apply a stock safety rule only after the live stock field is confirmed.
8. Calculate customer GBP pricing only from the validated live commercial feed and the approved pricing rule.
9. Run a dry-run report first: matched SKUs, unmatched SKUs, invalid rows, price changes and stock changes.
10. After review, switch the UK tyre range from staging to live. Enable checkout only for rows that pass every gate.

## Fail-closed rule

If the SFTP pull fails, the file is stale, required headers change, price is missing, stock is missing, or validation fails, keep tyre price/stock/checkout disabled rather than falling back to sample values.

## Files prepared before SFTP

- `uk-tyres.html` — customer-facing staged UK tyre catalogue
- `data/uk-tireroom-tyres-staging-1.json`
- `data/uk-tireroom-tyres-staging-2.json`
- `data/uk-tireroom-tyres-staging-3.json`
- `data/uk-tireroom-feed-state.json`

The three catalogue batches contain 117 references each, for a total of 351.
