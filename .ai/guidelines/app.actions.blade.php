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

@boostsnippet('Domain action with DTO', 'php')
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
@endboostsnippet

@boostsnippet('Simple action without dependencies', 'php')
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
@endboostsnippet

@boostsnippet('Calling an action from a controller', 'php')
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
@endboostsnippet
