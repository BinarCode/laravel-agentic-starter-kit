# Restock — Project Rules

> DDD principles from "Laravel Beyond CRUD" (Spatie). MANDATORY — overrides default Laravel conventions.

## Two-Layer Architecture

1. **Domain Layer** (`app/Domain/`) — Pure business logic. NEVER depends on HTTP.
2. **Application Layer** (`app/Http/`, `app/Jobs/`, `app/Console/`) — Thin wrappers that consume the domain.

**The golden rule**: Domain code NEVER depends on application code. The dependency arrow always points inward: Application → Domain.

## Directory Structure

```
app/
├── Domain/
│   ├── Inventory/
│   │   ├── Actions/            # Business operations

│   │   ├── Data/               # DTOs (Data Transfer Objects)

│   │   ├── Models/             # Eloquent models

│   │   ├── QueryBuilders/      # Custom Eloquent builders

│   │   ├── Collections/        # Custom Eloquent collections

│   │   ├── States/             # State pattern classes

│   │   ├── Enums/              # PHP native enums

│   │   ├── Events/             # Domain events

│   │   ├── Exceptions/         # Domain exceptions

│   │   └── Rules/              # Validation rules

│   │
│   ├── Ordering/               # Purchase orders, PO workflow

│   │   ├── Actions/
│   │   ├── Data/
│   │   ├── Models/
│   │   ├── States/
│   │   └── ...
│   │
│   ├── WooCommerce/            # Integration, sync, webhooks

│   │   ├── Actions/
│   │   ├── Data/
│   │   └── ...
│   │
│   └── Billing/                # Subscriptions, plans

│       ├── Actions/
│       ├── Data/
│       └── ...
│
├── Http/
│   ├── Controllers/
│   │   ├── DashboardController.php
│   │   ├── BrandController.php
│   │   ├── OrderController.php
│   │   ├── ReorderController.php
│   │   └── SettingsController.php
│   ├── Requests/               # Form requests (validation)

│   └── Middleware/
│
├── Console/
│   └── Commands/               # Artisan commands

│
├── Jobs/                       # Queued jobs (thin wrappers around actions)

│
└── Actions/                    # Cross-cutting actions that span multiple domains

```

## Mandatory Patterns

### Actions

All business logic lives in `app/Domain/{Domain}/Actions/`. `final readonly` class with a single `__invoke()` method. Composable via constructor injection.

### DTOs (Spatie Laravel Data v4)

All data entering the domain is wrapped in a DTO extending `Spatie\LaravelData\Data`. Lives in `app/Domain/{Domain}/Data/`.

### Thin Controllers

Max 15 lines. Validate via DTO → call action → return Inertia response.


### Lean Models

`app/Domain/{Domain}/Models/`. ONLY relationships, casts, accessors. No business logic. Extract scopes to QueryBuilders.

### QueryBuilders

`app/Domain/{Domain}/QueryBuilders/`. Extend `Builder`, register via `newEloquentBuilder()` on the model.

### Enums

`app/Domain/{Domain}/Enums/`. PHP native enums. Encapsulate labels, colors, allowed transitions.

### Thin Jobs

Jobs call exactly one action via `__invoke()`. No business logic in jobs.

### Frontend Components (shadcn-vue)

Two-tier component strategy:

1. **`components/ui/`** — shadcn-vue primitives (Button, Card, Dialog, Sheet, Select, etc.). Never modify these directly — they're managed by the shadcn CLI.
2. **`components/common/`** — Higher-level domain components that wrap shadcn primitives into reusable, project-specific abstractions. This is where most UI work happens.

Wrap repeated UI patterns into domain components early. Don't scatter raw shadcn composition across pages.

```vue
<!-- BAD: raw shadcn composition repeated across pages -->
<Badge :class="cn(
  order.status === 'draft' && 'bg-zinc-100 text-zinc-600',
  order.status === 'in_transit' && 'bg-blue-100 text-blue-700',
)">
  {{ order.status_label }}
</Badge>

<!-- GOOD: domain component in components/common/ -->
<StatusBadge :status="order.status" :label="order.status_label" />
```

Examples of domain components for this project:
- `StatusBadge` — PO status with color mapping
- `UrgencyDot` — critical/warning/safe indicator
- `KpiCard` — stat card with icon, value, footnote
- `StockDonut` — circular stock level indicator
- `ProductRow` — product image + name + EAN (used in reorder, PO detail, brand detail)
- `DataTable` — table with search, filters, pagination, checkbox selection

## NEVER

1. Business logic in models or controllers — use Actions
2. Raw arrays as DTOs — use `Spatie\LaravelData\Data`
3. Domain code importing HTTP classes (`Request`, `Controller`)
4. Actions with `handle()` — use `__invoke()`
5. Models/Actions in `app/Models/` or `app/Actions/` — use `app/Domain/{Domain}/`
6. Actions longer than 50 lines — compose smaller actions
7. Raw shadcn composition repeated across pages — extract to `components/common/`

<!-- PHP standards, Laravel conventions, naming, testing, Inertia, Wayfinder rules are provided by Boost via .ai/guidelines/ below -->

<laravel-boost-guidelines>
<!-- architecture & actions rules are in the top section of this file, not duplicated here -->

## Core Principle

**Returning DTOs to Inertia** — Data objects are automatically serializable. Use them as Inertia page props:

<!-- DTO as Inertia prop -->
```php
public function show(PurchaseOrder $order): \Inertia\Response
{
    return inertia('Orders/Show', [
        'order' => PurchaseOrderData::from($order),
    ]);
}
```

## Inertia View Data

When passing data to Inertia views, transform domain models into simple arrays/objects. Do NOT pass Eloquent models directly to the frontend.

**Rules:**
- Use Inertia's `mapInto()` or manual `->map()` to transform collections
- Define TypeScript interfaces that match the data shape
- Keep view data flat — avoid deep nesting of relations
- Paginate server-side, not client-side

## Testing

- **Unit test actions** — they are the core business logic; pass DTOs, assert outcomes
- **Unit test states/enums** — verify behavior per state, verify allowed transitions
- **Feature test controllers** — HTTP tests that verify the full request/response cycle
- **Test domain code in isolation** — actions should be testable without HTTP context
- Use factories within each domain: `app/Domain/{DomainName}/Factories/`

## Decision Checklist: Where Does This Code Go?

| Question | Answer |
|----------|--------|
| Does it validate HTTP input? | `app/Http/Requests/` |
| Does it orchestrate a business operation? | `app/Domain/{Domain}/Actions/` |
| Does it represent structured data flowing in? | `app/Domain/{Domain}/Data/` (DTO) |
| Does it query the database with reusable scopes? | `app/Domain/{Domain}/QueryBuilders/` |
| Does it define a model's status lifecycle? | `app/Domain/{Domain}/Enums/` or `States/` |
| Does it handle async work? | `app/Jobs/` (thin wrapper) calling an Action |
| Does it run on a schedule? | `app/Console/Commands/` calling an Action |
| Does it persist data and define relations? | `app/Domain/{Domain}/Models/` |
| Is it a cross-domain utility? | `app/Support/` |

## Anti-Patterns: NEVER Do These

1. **Fat models** — NEVER put business logic (calculations, mail sending, PDF generation) in models. Use actions.
2. **Fat controllers** — NEVER put business logic in controllers. Controllers validate, build DTOs, call actions, return responses.
3. **Raw arrays as DTOs** — NEVER pass `$request->validated()` arrays through the system. Wrap in a DTO.
4. **Domain depending on HTTP** — NEVER import Request, Controller, or Middleware classes in domain code.
5. **Business logic in jobs** — NEVER put logic in jobs. Jobs call actions.
6. **God actions** — NEVER create actions longer than 50 lines. Compose smaller actions instead.
7. **Skipping the domain structure** — NEVER place models, actions, or DTOs in the default `app/Models/` or `app/Actions/` when they belong to a specific domain.


=== foundation rules ===

## Skills Activation

This project has domain-specific skills available. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

- `wayfinder-development` — Activates whenever referencing backend routes in frontend components. Use when importing from @/actions or @/routes, calling Laravel routes from TypeScript, or working with Wayfinder route functions.
- `inertia-vue-development` — Develops Inertia.js v3 Vue client-side applications. Activates when creating Vue pages, forms, or navigation; using <Link>, <Form>, useForm, useHttp, setLayoutProps, or router; working with deferred props, prefetching, optimistic updates, instant visits, or polling; or when user mentions Vue with Inertia, Vue pages, Vue forms, or Vue navigation.
- `tailwindcss-development` — Always invoke when the user's message includes 'tailwind' in any form. Also invoke for: building responsive grid layouts (multi-column card grids, product grids), flex/grid page structures (dashboards with sidebars, fixed topbars, mobile-toggle navs), styling UI components (cards, tables, navbars, pricing sections, forms, inputs, badges), adding dark mode variants, fixing spacing or typography, and Tailwind v3/v4 work. The core use case: writing or fixing Tailwind utility classes in HTML templates (Blade, JSX, Vue). Skip for backend PHP logic, database queries, API routes, JavaScript with no HTML/CSS component, CSS file audits, build tool configuration, and vanilla CSS.
- `fortify-development` — Laravel Fortify headless authentication backend development. Activate when implementing authentication features including login, registration, password reset, email verification, two-factor authentication (2FA/TOTP), profile updates, headless auth, authentication scaffolding, or auth guards in Laravel applications.
- `spatie-laravel-php-standards` — Apply Spatie's Laravel and PHP coding standards for any task that creates, edits, reviews, refactors, or formats Laravel/PHP code or Blade templates; use for controllers, Eloquent models, routes, config, validation, migrations, tests, and related files to align with Laravel conventions and PSR-12.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

=== boost rules ===

# Laravel Boost

- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan Commands

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`, `php artisan tinker --execute "..."`).
- Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.

## URLs

- Whenever you share a project URL with the user, you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain/IP, and port.

## Debugging

- Use the `database-query` tool when you only need to read from the database.
- Use the `database-schema` tool to inspect table structure before writing migrations or models.
- To execute PHP code for debugging, run `php artisan tinker --execute "your code here"` directly.
- To read configuration values, read the config files directly or run `php artisan config:show [key]`.
- To inspect routes, run `php artisan route:list` directly.
- To check environment variables, read the `.env` file directly.

## Reading Browser Logs With the `browser-logs` Tool

- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)

- Boost comes with a powerful `search-docs` tool you should use before trying other approaches when working with Laravel or Laravel ecosystem packages. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic-based queries at once. For example: `['rate limiting', 'routing rate limiting', 'routing']`. The most relevant results will be returned first.
- Do not add package names to queries; package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'.
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit".
3. Quoted Phrases (Exact Position) - query="infinite scroll" - words must be adjacent and in that order.
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit".
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms.

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.

## Constructors

- Use PHP 8 constructor property promotion in `__construct()`.
    - `public function __construct(public GitHub $github) { }`
- Do not allow empty `__construct()` methods with zero parameters unless the constructor is private.

## Type Declarations

- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<!-- Explicit Return Types and Method Params -->
```php
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
```

## Enums

- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.

## Comments

- Prefer PHPDoc blocks over inline comments. Never use comments within the code itself unless the logic is exceptionally complex.

## PHPDoc Blocks

- Add useful array shape type definitions when appropriate.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-vue-development` when working with Inertia Vue client-side patterns.

# Inertia v3

- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

## Database

- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries.
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

### APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

# Project Coding Guidelines

- This codebase follows Spatie's Laravel & PHP guidelines.
- Always activate the `spatie-laravel-php-standards` skill whenever writing, editing, reviewing, or formatting Laravel or PHP code.

</laravel-boost-guidelines>
