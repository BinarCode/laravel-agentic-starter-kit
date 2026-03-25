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

@boostsnippet('DTO extending Spatie Data', 'php')
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
@endboostsnippet

@boostsnippet('DTO with validation rules', 'php')
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
@endboostsnippet

**Constructing DTOs in controllers** — use `Data::from()` to auto-map from requests:

@boostsnippet('DTO from request in controller', 'php')
public function store(
    Request $request,
    CreatePurchaseOrder $action,
): RedirectResponse {
    $data = CreatePurchaseOrderData::from($request);

    $order = $action($data);

    return redirect()->route('orders.show', $order);
}
@endboostsnippet

**Returning DTOs to Inertia** — Data objects are automatically serializable. Use them as Inertia page props:

@boostsnippet('DTO as Inertia prop', 'php')
public function show(PurchaseOrder $order): \Inertia\Response
{
    return inertia('Orders/Show', [
        'order' => PurchaseOrderData::from($order),
    ]);
}
@endboostsnippet

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

@boostsnippet('Action example', 'php')
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
@endboostsnippet

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

@boostsnippet('Lean model example', 'php')
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
@endboostsnippet

## QueryBuilders

Extract query scopes into dedicated QueryBuilder classes to keep models lean.

**Rules:**
- Live in `app/Domain/{DomainName}/QueryBuilders/`
- Extend `Illuminate\Database\Eloquent\Builder`
- Return `self` for chainability
- Override `newEloquentBuilder()` on the model to register

@boostsnippet('QueryBuilder example', 'php')
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
@endboostsnippet

## States and Transitions

Use the state pattern for models with lifecycle status. This is critical for the Purchase Order workflow (Draft → AwaitingConfirmation → InTransit → Received).

**Rules:**
- States live in `app/Domain/{DomainName}/States/`
- States provide data and behavior — they read from the model and return computed values
- States must NOT have side effects (no DB writes, no mail sending)
- Transitions handle the mutation — they change state and trigger side effects
- Use PHP enums for simple status fields; use the state pattern when behavior varies by status

@boostsnippet('State pattern for PO status', 'php')
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
@endboostsnippet

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

@boostsnippet('Thin controller example', 'php')
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
@endboostsnippet

## Jobs (Application Layer)

Jobs are thin wrappers around actions. They provide the queueing infrastructure.

**Rules:**
- Jobs live in `app/Jobs/`
- A job's `handle()` method should invoke exactly one action
- Jobs handle queue-specific concerns (retries, timeouts, rate limiting)
- The business logic stays in the action, not the job

@boostsnippet('Job wrapping an action', 'php')
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
@endboostsnippet

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
