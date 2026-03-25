
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
