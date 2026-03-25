# Laravel Agentic Starter Kit

A production-ready Laravel starter kit for building AI-powered applications with Inertia.js v3, Vue 3, and Tailwind CSS v4.

Inspired by [nunomaduro/laravel-starter-kit-inertia-vue](https://github.com/nunomaduro/laravel-starter-kit-inertia-vue), adapted to [BinarCode](https://binarcode.com) standards with DDD architecture, actions pattern, and agentic AI tooling.

## What's Included

- **Laravel 13** with PHP 8.5
- **Inertia.js v3** + **Vue 3** — SPA without SPA complexity
- **Tailwind CSS v4** with shadcn-vue components (reka-ui + CVA + tailwind-merge)
- **Laravel Fortify** — Headless authentication (login, register, password reset, email verification, 2FA)
- **Laravel Wayfinder** — Type-safe route generation for frontend
- **Laravel Boost** — MCP server for AI-assisted development (database queries, docs search, error logs)
- **Pest 5** — Testing with type coverage and browser testing plugins
- **Rector + Pint** — Automated code quality and formatting
- **Larastan** — Static analysis

## Architecture

This starter follows DDD principles from "Laravel Beyond CRUD" (Spatie):

```
app/
├── Domain/               # Business logic grouped by domain
│   └── {YourDomain}/
│       ├── Actions/      # final readonly classes with __invoke()
│       ├── Data/         # DTOs extending Spatie Laravel Data
│       ├── Models/       # Lean Eloquent models (relationships + casts only)
│       ├── Enums/        # PHP native enums
│       ├── QueryBuilders/
│       └── Events/
├── Http/                 # Thin controllers, form requests, middleware
├── Jobs/                 # Thin wrappers that call domain actions
└── Console/              # Artisan commands that call domain actions
```

**Key rules:**
- All business logic lives in Actions — never in controllers or models
- Data flows through DTOs — never raw arrays
- Domain code never depends on HTTP — the dependency arrow always points inward

## Getting Started

```bash
# Clone the starter kit
composer create-project binarcode/laravel-agentic-starter-kit my-app
cd my-app

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

| Command | Description |
|---------|-------------|
| `composer dev` | Start server, queue, logs, and Vite concurrently |
| `composer lint` | Run Rector, Pint, and Oxfmt |
| `composer test` | Full test suite (type coverage, unit, linting, static analysis) |
| `composer test:unit` | Pest tests with coverage |

## AI-Powered Development

This starter kit is designed to work with AI coding assistants like Claude Code. It includes:

- **CLAUDE.md** — Project rules and architecture guidelines that AI assistants follow automatically
- **Laravel Boost MCP** — Gives AI assistants access to your database schema, docs, error logs, and more
- **Wayfinder** — Type-safe routes so AI-generated frontend code calls the right endpoints

## Frontend Components

Two-tier component strategy:

1. **`components/ui/`** — shadcn-vue primitives (Button, Card, Dialog, etc.). Managed by the shadcn CLI.
2. **`components/common/`** — Domain-specific components that wrap shadcn primitives into reusable abstractions.

## Credits

- [nunomaduro/laravel-starter-kit-inertia-vue](https://github.com/nunomaduro/laravel-starter-kit-inertia-vue) — Original inspiration
- [Spatie](https://spatie.be) — Laravel Beyond CRUD architecture and coding guidelines
- [BinarCode](https://binarcode.com) — Maintainers

## License

MIT
