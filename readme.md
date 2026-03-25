# Laravel Agentic Starter Kit

A production-ready Laravel starter kit for building AI-powered applications with Inertia.js v3, Vue 3, and Tailwind CSS v4.

Inspired by [nunomaduro/laravel-starter-kit-inertia-vue](https://github.com/nunomaduro/laravel-starter-kit-inertia-vue), adapted to [BinarCode](https://binarcode.com) standards with DDD architecture, actions pattern, and agentic AI tooling.

## Why This Works

### AI understands the rules because they're written down

The `CLAUDE.md` file is a battle-tested set of project rules — DDD boundaries, actions pattern, DTO conventions, component strategy, and anti-patterns. When an AI assistant reads it, it doesn't guess your architecture: it follows it. Every controller stays thin, every action stays in the domain layer, every DTO uses Spatie Laravel Data. The AI becomes a team member that actually read the docs.

### Spatie coding standards, enforced automatically

This kit ships with [Spatie's Laravel & PHP guidelines](https://spatie.be/guidelines) baked in — PSR-12, typed properties, constructor promotion, early returns, no-else patterns, and strict docblock rules. Rector and Pint enforce them on every `composer lint` run. The AI assistant follows the same standards because they're in the project rules.

### 100% static analysis enforcement

Larastan runs at maximum level on every `composer test`. Type errors don't ship. Combined with Pest's type coverage plugin, every function parameter, return type, and property is verified. This catches the kind of bugs that AI-generated code is most prone to — wrong types, missing nullable checks, implicit mixed returns.

### Frontend architecture inspired by Spatie's approach

The UI layer follows the component philosophy described in [Rethinking our frontend future at Spatie](https://spatie.be/blog/rethinking-our-frontend-future-at-spatie) — low-level primitives (shadcn-vue / reka-ui) wrapped into higher-level domain components in a `common` folder. As the project matures, you replace primitives with lighter, browser-native alternatives without rewriting pages. The two-tier strategy (`components/ui/` for shadcn primitives, `components/common/` for your abstractions) keeps UI code DRY and upgrade-friendly.

### Agentic tooling built in

Laravel Boost gives AI assistants direct access to your database schema, documentation, error logs, and browser console — no copy-pasting stack traces. Wayfinder generates type-safe route functions so the frontend never guesses endpoint URLs. Together, they turn AI coding assistants from code generators into context-aware collaborators.

## What's Included

- **Laravel 13** with PHP 8.5
- **Inertia.js v3** + **Vue 3** — SPA without SPA complexity
- **Tailwind CSS v4** with shadcn-vue components (reka-ui + CVA + tailwind-merge)
- **Laravel Fortify** — Headless authentication (login, register, password reset, email verification, 2FA)
- **Laravel Wayfinder** — Type-safe route generation for frontend
- **Laravel Boost** — MCP server for AI-assisted development
- **Pest 5** — Testing with type coverage and browser testing plugins
- **Rector + Pint** — Automated code quality and formatting
- **Larastan** — 100% static analysis at max level

## Architecture

DDD principles from "Laravel Beyond CRUD" (Spatie):

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

## Credits

- [nunomaduro/laravel-starter-kit-inertia-vue](https://github.com/nunomaduro/laravel-starter-kit-inertia-vue) — Original inspiration
- [Spatie](https://spatie.be) — Laravel Beyond CRUD architecture, coding guidelines, and frontend philosophy
- [BinarCode](https://binarcode.com) — Maintainers

## License

MIT
