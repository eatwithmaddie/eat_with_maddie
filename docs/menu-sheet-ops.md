# Daily Menu Sheet Operations

The homepage pulls daily dishes from one published CSV.

## Tab setup

Create one tab (for example: `daily_menu`) with these columns:

- `dish` (required)
- `price` (required)
- `sort_order` (optional but recommended)
- `category` (optional)

If you skip `category`, dishes still load and display in a flat list.

## Rules

- Keep only dishes available today.
- `price` must be numeric only (example: `2500`).
- `sort_order` should be numeric for stable ordering.

## Drinks on homepage

Drinks are shown in a separate expandable section on the site, so you do not need to maintain drinks in the daily sheet.

## Publish to CSV

1. In Google Sheets, open the daily tab.
2. Use Share > Publish to web.
3. Choose CSV format and copy the URL.
4. Set `VITE_DAILY_MENU_CSV_URL` in your environment.

If the sheet URL fails, the app falls back to `client/public/data/daily-menu-fallback.json`.
