# Restock

Intelligent inventory restocking platform for WooCommerce stores. Monitors stock levels, suggests reorder decisions, and automatically updates inventory when orders are received.

## Core Workflow

1. **Monitor** — Syncs with WooCommerce (webhook + polling fallback), tracks stock levels and daily sales velocity
2. **Suggest** — AI calculates reorder urgency, quantities, and revenue-at-risk per product/brand
3. **Order** — Build purchase orders, export as Excel, send to supplier
4. **Confirm** — Upload supplier invoice (PDF/Excel), AI parses and matches to PO, user reviews diff
5. **Receive** — Mark order as received, stock auto-updates in WooCommerce

## Tech Stack

- **Backend**: Laravel 13, PHP 8.5
- **Frontend**: Inertia.js v3 + Vue 3 + Tailwind CSS v4
- **UI**: reka-ui + CVA + tailwind-merge (shadcn-vue pattern)
- **Auth**: Laravel Fortify
- **MCP**: laravel/mcp
- **Testing**: Pest 5
- **Deployment**: Laravel Forge
- **Starter Kit**: [nunomaduro/laravel-starter-kit-inertia-vue](https://github.com/nunomaduro/laravel-starter-kit-inertia-vue)

## Getting Started

```bash
# Install dependencies
composer install
bun install

# Setup environment
cp .env.example .env
php artisan key:generate
php artisan migrate

# Start development
composer dev
```

## Available Commands

- `composer dev` — Start server, queue, logs, and Vite concurrently
- `composer lint` — Run Rector, Pint, and Oxfmt
- `composer test` — Full test suite (type coverage, unit tests, linting, static analysis)
- `composer test:unit` — Pest tests with coverage

## License

Proprietary — BinarCode SRL
