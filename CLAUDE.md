# Restock — Project Rules

> DDD principles from "Laravel Beyond CRUD" (Spatie). MANDATORY — overrides default Laravel conventions.

## Two-Layer Architecture

1. **Domain Layer** (`app/Domain/`) — Pure business logic. NEVER depends on HTTP.
2. **Application Layer** (`app/Http/`, `app/Jobs/`, `app/Console/`) — Thin wrappers that consume the domain.

## Mandatory Patterns

### Actions

All business logic lives in `app/Domain/{Domain}/Actions/`. `final readonly` class with a single `__invoke()` method. Composable via constructor injection.

```php
<?php

declare(strict_types=1);

namespace App\Domain\Ordering\Actions;

use App\Domain\Ordering\Data\CreatePurchaseOrderData;
use App\Domain\Ordering\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;

final readonly class CreatePurchaseOrder
{
    public function __construct(
        private CreatePurchaseOrderLine $createLine,
    ) {}

    public function __invoke(CreatePurchaseOrderData $data): PurchaseOrder
    {
        return DB::transaction(function () use ($data): PurchaseOrder {
            $order = PurchaseOrder::create([
                'supplier_id' => $data->supplierId,
                'notes' => $data->notes,
            ]);

            foreach ($data->lines as $lineData) {
                ($this->createLine)($order, $lineData);
            }

            return $order;
        });
    }
}
```

### DTOs (Spatie Laravel Data v4)

All data entering the domain is wrapped in a DTO extending `Spatie\LaravelData\Data`. Lives in `app/Domain/{Domain}/Data/`.

```php
<?php

declare(strict_types=1);

namespace App\Domain\Ordering\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\DataCollection;

final class CreatePurchaseOrderData extends Data
{
    public function __construct(
        public int $supplier_id,
        #[DataCollectionOf(CreatePurchaseOrderLineData::class)]
        public DataCollection $lines,
        public ?string $notes = null,
    ) {}
}
```

### Thin Controllers

Max 15 lines. Validate via DTO → call action → return Inertia response.

```php
public function store(Request $request, CreatePurchaseOrder $action): RedirectResponse
{
    $data = CreatePurchaseOrderData::from($request);

    $order = $action($data);

    return redirect()->route('orders.show', $order);
}
```

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
=== .ai/app.actions rules ===

# App/Actions guidelines

- This application uses the Action pattern with **domain-oriented structure**. Actions live in `app/Domain/{DomainName}/Actions/`, NOT in `app/Actions/`.
- Cross-cutting actions that span multiple domains may live in `app/Actions/` as an exception.
- Actions are named based on what they do, with no suffix: `CreatePurchaseOrder`, not `CreatePurchaseOrderAction`.
- Actions will be called from many different places: jobs, commands, HTTP requests, API requests, MCP requests, and other actions.
- **Actions are invokable** — use `__invoke()` as the single public method, NOT `handle()`. This allows calling actions as functions: `$action($data)`.
- Inject dependencies (other actions, services) via constructor using private properties.
- When composing actions (calling one action from another), wrap the property in parentheses: `($this->createLine)($order, $data)`.
- Create new actions with `php artisan make:action "{name}" --no-interaction`, then move to the correct domain directory and change `handle()` to `__invoke()`.
- Wrap complex operations in `DB::transaction()` within actions when multiple models are involved.
- Actions receive DTOs or domain objects as input — NEVER raw arrays or Request objects.
- Actions return domain objects (Models, DTOs, primitives) — NEVER HTTP responses.
- Actions must be `final readonly` classes.
- Some actions won't require dependencies via `__construct` and they can use just the `__invoke()` method.

<!-- Domain action with DTO -->
```php
<?php

declare(strict_types=1);

namespace App\Domain\Ordering\Actions;

use App\Domain\Ordering\Data\CreatePurchaseOrderData;
use App\Domain\Ordering\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;

final readonly class CreatePurchaseOrder
{
    public function __construct(
        private CreatePurchaseOrderLine $createLine,
    ) {}

    public function __invoke(CreatePurchaseOrderData $data): PurchaseOrder
    {
        return DB::transaction(function () use ($data): PurchaseOrder {
            $order = PurchaseOrder::create([
                'supplier_id' => $data->supplierId,
                'notes' => $data->notes,
            ]);

            foreach ($data->lines as $lineData) {
                ($this->createLine)($order, $lineData);
            }

            return $order;
        });
    }
}
```

<!-- Simple action without dependencies -->
```php
<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Actions;

use App\Domain\Inventory\Models\Product;

final readonly class CalculateDaysUntilStockout
{
    public function __invoke(Product $product): ?int
    {
        if ($product->daily_sales <= 0) {
            return null;
        }

        return (int) floor($product->stock / $product->daily_sales);
    }
}
```

<!-- Calling an action from a controller -->
```php
// Type-hint in method signature — Laravel auto-resolves from container
// Use Spatie Data::from($request) to build the DTO
public function store(
    Request $request,
    CreatePurchaseOrder $action,
): RedirectResponse {
    $data = CreatePurchaseOrderData::from($request);

    $order = $action($data);

    return redirect()->route('orders.show', $order);
}
```

=== .ai/architecture rules ===

# Domain-Driven Architecture Rules

> Based on "Laravel Beyond CRUD" by Spatie. These rules are MANDATORY for all code generation, refactoring, and architectural decisions. Violations must be fixed before any PR is merged.

## Core Principle: Domain vs Application

The codebase is split into two layers:

1. **Domain Layer** (`app/Domain/`) — Pure business logic. Knows nothing about HTTP, controllers, views, or any delivery mechanism. This is the heart of the application.
2. **Application Layer** (`app/Http/`, `app/Console/`, `app/Jobs/`) — Consumes the domain. Provides infrastructure for end-users to access domain functionality (HTTP controllers, CLI commands, queued jobs).

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

## Domain Identification

When deciding where code belongs, ask: "What business concept does this relate to?"

| Domain | Responsibility | Key Models |
|--------|---------------|------------|
| **Inventory** | Products, brands, stock levels, sales velocity, health score, reorder rules | Product, Brand, ReorderRule |
| **Ordering** | Purchase orders, PO lines, workflow (draft → confirmed → transit → received) | PurchaseOrder, PurchaseOrderLine |
| **WooCommerce** | Store connection, product sync, stock write-back, webhooks | WooCommerceStore, SyncLog |
| **Billing** | Subscriptions, plans, trial management, payments | Subscription, Plan |

## Data Transfer Objects (DTOs)

DTOs are the entry point for data flowing into the domain. All DTOs extend `Spatie\LaravelData\Data` (`spatie/laravel-data` v4).

**Rules:**
- DTOs live in `app/Domain/{DomainName}/Data/`
- Extend `Spatie\LaravelData\Data` — this gives you: automatic validation, `from()` factory, request casting, nested data, TypeScript transformer, and Inertia lazy/optional props
- Name them descriptively: `CreatePurchaseOrderData`, `SyncProductData`
- DTOs are immutable by default (use `readonly` properties)
- Use `Data::from($request)` in controllers — Spatie Data handles the mapping automatically
- Use `Data::collect()` for typed collections of data objects
- Validation rules are defined on the DTO itself via typed properties and optional `rules()` method — no separate Form Request needed for simple cases

<!-- DTO extending Spatie Data -->
```php
<?php

declare(strict_types=1);

namespace App\Domain\Ordering\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\DataCollection;

final class CreatePurchaseOrderData extends Data
{
    public function __construct(
        public int $supplier_id,
        #[DataCollectionOf(CreatePurchaseOrderLineData::class)]
        public DataCollection $lines,
        public ?string $notes = null,
    ) {}
}
```

<!-- DTO with validation rules -->
```php
<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Data;

use Spatie\LaravelData\Data;

final class UpdateReorderRulesData extends Data
{
    public function __construct(
        public int $safety_buffer_days,
        public int $target_coverage_days,
    ) {}

    public static function rules(): array
    {
        return [
            'safety_buffer_days' => ['required', 'integer', 'min:1', 'max:90'],
            'target_coverage_days' => ['required', 'integer', 'min:7', 'max:365'],
        ];
    }
}
```

**Constructing DTOs in controllers** — use `Data::from()` to auto-map from requests:

<!-- DTO from request in controller -->
```php
public function store(
    Request $request,
    CreatePurchaseOrder $action,
): RedirectResponse {
    $data = CreatePurchaseOrderData::from($request);

    $order = $action($data);

    return redirect()->route('orders.show', $order);
}
```

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

## Actions

Actions are the primary place for business logic. They represent user stories as first-class citizens.

**Rules:**
- Actions live in `app/Domain/{DomainName}/Actions/`
- One action = one business operation
- Named by what they do: `CreatePurchaseOrder`, `ConfirmPurchaseOrderFromInvoice`, `SyncProductsFromWooCommerce`
- NO suffix needed (the starter kit convention drops the `Action` suffix). The namespace `Actions/` makes it clear.
- Actions are **invokable**: single public `__invoke()` method — receives DTOs or domain objects, returns domain objects
- This allows calling actions as functions: `$action($data)` or `($this->createLine)($order, $lineData)`
- `final readonly` class
- Inject dependencies via constructor (other actions, services, etc.)
- Actions are callable from controllers, jobs, commands, MCP tools, and other actions
- Wrap complex multi-model operations in `DB::transaction()`
- Actions must NEVER depend on HTTP-layer classes (no Request, no Controller)

<!-- Action example -->
```php
<?php

declare(strict_types=1);

namespace App\Domain\Ordering\Actions;

use App\Domain\Ordering\Data\CreatePurchaseOrderData;
use App\Domain\Ordering\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;

final readonly class CreatePurchaseOrder
{
    public function __construct(
        private CreatePurchaseOrderLine $createLine,
    ) {}

    public function __invoke(CreatePurchaseOrderData $data): PurchaseOrder
    {
        return DB::transaction(function () use ($data): PurchaseOrder {
            $order = PurchaseOrder::create([
                'supplier_id' => $data->supplierId,
                'notes' => $data->notes,
                'status' => PurchaseOrderStatus::Draft,
            ]);

            foreach ($data->lines as $lineData) {
                ($this->createLine)($order, $lineData);
            }

            return $order;
        });
    }
}
```

**Composing actions**: Actions can depend on other actions via constructor injection. Keep the dependency chain shallow (max 2-3 levels deep).

## Models

Models are data providers, NOT business logic containers. Keep them lean.

**Rules:**
- Models live in `app/Domain/{DomainName}/Models/`
- Models should contain ONLY: relationships, casts, accessors for data presentation, scopes (or better: QueryBuilders)
- Models must NOT contain: business logic, calculations, validation, mail sending, PDF generation
- If a model grows beyond ~150 lines, extract query scopes to QueryBuilders, complex relations to dedicated classes, and calculations to Actions
- Use custom QueryBuilder classes instead of scopes for complex queries
- Use custom Collection classes when you have domain-specific collection operations
- Map generic model events to specific event classes via `$dispatchesEvents`

<!-- Lean model example -->
```php
<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Models;

use App\Domain\Inventory\Enums\ProductUrgency;
use App\Domain\Inventory\QueryBuilders\ProductQueryBuilder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Product extends Model
{
    protected function casts(): array
    {
        return [
            'urgency' => ProductUrgency::class,
            'last_synced_at' => 'immutable_datetime',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function newEloquentBuilder($query): ProductQueryBuilder
    {
        return new ProductQueryBuilder($query);
    }
}
```

## QueryBuilders

Extract query scopes into dedicated QueryBuilder classes to keep models lean.

**Rules:**
- Live in `app/Domain/{DomainName}/QueryBuilders/`
- Extend `Illuminate\Database\Eloquent\Builder`
- Return `self` for chainability
- Override `newEloquentBuilder()` on the model to register

<!-- QueryBuilder example -->
```php
<?php

declare(strict_types=1);

namespace App\Domain\Inventory\QueryBuilders;

use App\Domain\Inventory\Enums\ProductUrgency;
use Illuminate\Database\Eloquent\Builder;

/** @extends Builder<\App\Domain\Inventory\Models\Product> */
final class ProductQueryBuilder extends Builder
{
    public function critical(): self
    {
        return $this->where('urgency', ProductUrgency::Critical);
    }

    public function forBrand(int $brandId): self
    {
        return $this->where('brand_id', $brandId);
    }

    public function lowStock(int $thresholdDays = 14): self
    {
        return $this->whereRaw('stock / NULLIF(daily_sales, 0) < ?', [$thresholdDays]);
    }
}
```

## States and Transitions

Use the state pattern for models with lifecycle status. This is critical for the Purchase Order workflow (Draft → AwaitingConfirmation → InTransit → Received).

**Rules:**
- States live in `app/Domain/{DomainName}/States/`
- States provide data and behavior — they read from the model and return computed values
- States must NOT have side effects (no DB writes, no mail sending)
- Transitions handle the mutation — they change state and trigger side effects
- Use PHP enums for simple status fields; use the state pattern when behavior varies by status

<!-- State pattern for PO status -->
```php
<?php

declare(strict_types=1);

namespace App\Domain\Ordering\Enums;

enum PurchaseOrderStatus: string
{
    case Draft = 'draft';
    case AwaitingConfirmation = 'awaiting_confirmation';
    case InTransit = 'in_transit';
    case Received = 'received';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::AwaitingConfirmation => 'Awaiting confirmation',
            self::InTransit => 'In transit',
            self::Received => 'Received',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'zinc',
            self::AwaitingConfirmation => 'amber',
            self::InTransit => 'blue',
            self::Received => 'green',
        };
    }

    /** @return array<self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [self::AwaitingConfirmation],
            self::AwaitingConfirmation => [self::InTransit],
            self::InTransit => [self::Received],
            self::Received => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }
}
```

## Enums

**Rules:**
- Live in `app/Domain/{DomainName}/Enums/`
- Use PHP native enums (backed by `string` or `int`)
- PascalCase values: `case Draft`, `case InTransit`
- Encapsulate display logic (labels, colors, icons) in the enum itself
- Use enums for model casts

## Controllers (Application Layer)

Controllers are thin entry points. They validate, convert to DTOs, call actions, and return responses.

**Rules:**
- Plural resource names: `BrandsController`, `OrdersController`
- Stick to 7 CRUD methods: `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`
- For non-CRUD operations, extract to a new controller: `OrderReceiptController@store` for marking an order as received
- Controller methods should be 10-15 lines max
- Controllers call Actions — they do NOT contain business logic
- Use Form Requests for validation (these live in application layer)
- Return Inertia responses

<!-- Thin controller example -->
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\Ordering\Actions\CreatePurchaseOrder;
use App\Domain\Ordering\Data\CreatePurchaseOrderData;
use App\Http\Requests\StorePurchaseOrderRequest;
use Illuminate\Http\RedirectResponse;

final class PurchaseOrdersController
{
    public function store(
        StorePurchaseOrderRequest $request,
        CreatePurchaseOrder $action,
    ): RedirectResponse {
        $data = CreatePurchaseOrderData::from($request->validated());

        $order = $action($data);

        return redirect()->route('orders.show', $order);
    }
}
```

## Jobs (Application Layer)

Jobs are thin wrappers around actions. They provide the queueing infrastructure.

**Rules:**
- Jobs live in `app/Jobs/`
- A job's `handle()` method should invoke exactly one action
- Jobs handle queue-specific concerns (retries, timeouts, rate limiting)
- The business logic stays in the action, not the job

<!-- Job wrapping an action -->
```php
<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\WooCommerce\Actions\SyncProductsFromStore;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class SyncWooCommerceProductsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private int $storeId,
    ) {}

    public function handle(SyncProductsFromStore $action): void
    {
        $action($this->storeId);
    }
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

=== .ai/general rules ===

# General Guidelines

- Don't include any superfluous PHP Annotations, except ones that start with `@` for typing variables.

=== .ai/php-standards rules ===

# PHP & Laravel Coding Standards (Spatie)

## PHP Standards

- Follow PSR-1, PSR-2, and PSR-12
- `declare(strict_types=1)` in every file
- Use camelCase for non-public-facing strings
- Use short nullable notation: `?string` not `string|null`
- Always specify `void` return types when methods return nothing
- String interpolation over concatenation

## Class Structure

- Use typed properties, not docblocks
- Constructor property promotion when all properties can be promoted
- One trait per line
- Always use curly braces for control structures, even for single-line bodies

## Type Declarations & Docblocks

- Use typed properties over docblocks
- Specify return types including `void`
- Don't use docblocks for fully type-hinted methods (unless description needed)
- **Always import classnames in docblocks** — never use fully qualified names
- Use one-line docblocks when possible: `/** @var string */`
- Most common type should be first in multi-type docblocks
- If one parameter needs docblock, add docblocks for all parameters
- For iterables, always specify key and value types
- Use array shape notation for fixed keys, each key on its own line

<!-- Generics for iterables -->
```php
/** @return Collection<int, User> */
public function getUsers(): Collection
{
    // ...
}
```

<!-- Import classnames in docblocks -->
```php
use \Spatie\Url\Url;
/** @return Url */
```

<!-- Array param types -->
```php
/**
 * @param array<int, MyObject> $myArray
 * @param int $typedArgument
 */
function someFunction(array $myArray, int $typedArgument) {}
```

<!-- Array shape notation -->
```php
/** @return array{
   first: SomeClass,
   second: SomeClass
} */
```

## Control Flow

- **Happy path last**: Handle error conditions first, success case last
- **Avoid else**: Use early returns instead of nested conditions
- **Separate conditions**: Prefer multiple if statements over compound conditions
- **Always use curly brackets** even for single statements
- **Ternary operators**: Each part on own line unless very short

<!-- Happy path last pattern -->
```php
if (! $user) {
    return null;
}

if (! $user->isActive()) {
    return null;
}

// Happy path last — process active user...
return $user->process();
```

<!-- Ternary patterns -->
```php
// Short ternary
$name = $isFoo ? 'foo' : 'bar';

// Multi-line ternary
$result = $object instanceof Model ?
    $object->name :
    'A default value';

// Ternary instead of else
$condition
    ? $this->doSomething()
    : $this->doSomethingElse();
```

## Comments

Code should be self-documenting. Comments only for *why*, never for *what*. Adding comments should never be the first tactic to make code readable.

<!-- Self-documenting code over comments -->
```php
// BAD:
// Get the failed checks for this site
$checks = $site->checks()->where('status', 'failed')->get();

// GOOD:
$failedChecks = $site->checks()->where('status', 'failed')->get();
```

- Don't add comments that describe what the code does — make the code describe itself
- Use descriptive variable names instead of generic names + comments
- Only add comments when explaining *why* something non-obvious is done
- Never add comments to tests — test names should be descriptive enough

## Whitespace

- Add blank lines between statements for readability
- Exception: sequences of equivalent single-line operations
- No extra empty lines between `{}` brackets
- Let code "breathe" — avoid cramped formatting

## Validation

- Use array notation for multiple rules (easier for custom rule classes)
- Prefer DTO validation via Spatie Data over Form Requests for simple cases
- Custom validation rules use snake_case

<!-- Validation array notation -->
```php
public function rules(): array
{
    return [
        'email' => ['required', 'email'],
    ];
}
```

## Enums

- PascalCase values: `case Draft`, `case InTransit`

## Laravel Conventions

### Routes

- URLs: kebab-case (`/open-source`)
- Route names: camelCase (`->name('openSource')`)
- Parameters: camelCase (`{userId}`)
- Use tuple notation: `[Controller::class, 'method']`

### Controllers

- Plural resource names (`BrandsController`)
- Stick to CRUD methods (`index`, `create`, `store`, `show`, `edit`, `update`, `destroy`)
- Extract new controllers for non-CRUD actions

### Configuration

- Files: kebab-case (`pdf-generator.php`)
- Keys: snake_case (`chrome_path`)
- Add service configs to `config/services.php`, don't create new files
- Use `config()` helper, avoid `env()` outside config files

### Artisan Commands

- Names: kebab-case (`delete-old-records`)
- Always provide feedback
- Put output BEFORE processing item (easier debugging)

<!-- Artisan command output pattern -->
```php
$items->each(function(Item $item) {
    $this->info("Processing item id `{$item->id}`...");
    $this->processItem($item);
});

$this->comment("Processed {$items->count()} items.");
```

### Authorization

- Policies use camelCase: `Gate::define('editPost', ...)`
- Use CRUD words, but `view` instead of `show`

### Migrations

- Only `up()` methods, no `down()`

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `PurchaseOrder`, `OrderStatus` |
| Methods/Variables | camelCase | `getUserName`, `$firstName` |
| Routes | kebab-case | `/purchase-orders` |
| Config keys | snake_case | `woocommerce.api_key` |
| Controllers | plural + Controller | `BrandsController` |
| Jobs | action-based | `SyncWooCommerceProductsJob` |
| Events | tense-based | `PurchaseOrderReceived` |
| Listeners | action + Listener | `SendInvitationMailListener` |
| Commands | action + Command | `SyncProductsCommand` |
| Mailables | purpose + Mail | `AccountActivatedMail` |
| Enums | descriptive, no prefix | `PurchaseOrderStatus` |

## Testing

- Every change must be tested. Run `php artisan test --compact` with filename or filter.
- Arrange-act-assert pattern. Descriptive test method names.
- Unit test actions directly (pass DTOs, assert outcomes).
- Feature test controllers (HTTP request/response cycle).
- No comments in tests — test names should be descriptive enough.

=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.5
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v3
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v13
- laravel/prompts (PROMPTS) - v0
- laravel/wayfinder (WAYFINDER) - v0
- larastan/larastan (LARASTAN) - v3
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- pestphp/pest (PEST) - v5
- phpunit/phpunit (PHPUNIT) - v13
- rector/rector (RECTOR) - v2
- @inertiajs/vue3 (INERTIA_VUE) - v3
- tailwindcss (TAILWINDCSS) - v4
- vue (VUE) - v3
- @laravel/vite-plugin-wayfinder (WAYFINDER_VITE) - v0

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

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `bun run build`, `bun run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

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

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
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

## Controllers & Validation

- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

## Authentication & Authorization

- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Queues

- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

## Configuration

- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `bun run build` or ask the user to run `bun run dev` or `composer run dev`.

=== wayfinder/core rules ===

# Laravel Wayfinder

Wayfinder generates TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

- IMPORTANT: Activate `wayfinder-development` skill whenever referencing backend routes in frontend components.
- Invokable Controllers: `import StorePost from '@/actions/.../StorePostController'; StorePost()`.
- Parameter Binding: Detects route keys (`{post:slug}`) — `show({ slug: "my-post" })`.
- Query Merging: `show(1, { mergeQuery: { page: 2, sort: null } })` merges with current URL, `null` removes params.
- Inertia: Use `.form()` with `<Form>` component or `form.submit(store())` with useForm.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.

=== inertia-vue/core rules ===

# Inertia + Vue

Vue components must have a single root element.
- IMPORTANT: Activate `inertia-vue-development` when working with Inertia Vue client-side patterns.

=== laravel/fortify rules ===

# Laravel Fortify

- Fortify is a headless authentication backend that provides authentication routes and controllers for Laravel applications.
- IMPORTANT: Always use the `search-docs` tool for detailed Laravel Fortify patterns and documentation.
- IMPORTANT: Activate `developing-with-fortify` skill when working with Fortify authentication features.

=== spatie/boost-spatie-guidelines rules ===

# Project Coding Guidelines

- This codebase follows Spatie's Laravel & PHP guidelines.
- Always activate the `spatie-laravel-php-standards` skill whenever writing, editing, reviewing, or formatting Laravel or PHP code.

</laravel-boost-guidelines>
