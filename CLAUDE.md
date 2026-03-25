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

## NEVER

1. Business logic in models or controllers — use Actions
2. Raw arrays as DTOs — use `Spatie\LaravelData\Data`
3. Domain code importing HTTP classes (`Request`, `Controller`)
4. Actions with `handle()` — use `__invoke()`
5. Models/Actions in `app/Models/` or `app/Actions/` — use `app/Domain/{Domain}/`
6. Actions longer than 50 lines — compose smaller actions

---

## Stack

- PHP 8.5 / Laravel 13 / Inertia v3 / Vue 3 / Tailwind v4
- Auth: Fortify (headless) / UI: reka-ui + CVA + tailwind-merge / Icons: lucide-vue-next
- Routing: Wayfinder / Testing: Pest / Quality: Pint, Rector, Larastan, Oxlint
- Package manager: Bun

## PHP Standards

- Follow PSR-1, PSR-2, and PSR-12
- `declare(strict_types=1)` in every file
- Use camelCase for non-public-facing strings
- Use short nullable notation: `?string` not `string|null`
- Always specify `void` return types when methods return nothing
- String interpolation over concatenation

### Class Structure

- Use typed properties, not docblocks
- Constructor property promotion when all properties can be promoted
- One trait per line

### Type Declarations & Docblocks

- Use typed properties over docblocks
- Specify return types including `void`
- Don't use docblocks for fully type-hinted methods (unless description needed)
- **Always import classnames in docblocks** — never use fully qualified names
- Use one-line docblocks when possible: `/** @var string */`
- If one parameter needs docblock, add docblocks for all parameters
- Document iterables with generics:
  ```php
  /** @return Collection<int, User> */
  public function getUsers(): Collection
  ```
- For iterables, always specify key and value types:
  ```php
  /**
   * @param array<int, MyObject> $myArray
   * @param int $typedArgument
   */
  function someFunction(array $myArray, int $typedArgument) {}
  ```
- Use array shape notation for fixed keys, each key on its own line:
  ```php
  /** @return array{
     first: SomeClass,
     second: SomeClass
  } */
  ```

### Control Flow

- **Happy path last**: Handle error conditions first, success case last
- **Avoid else**: Use early returns instead of nested conditions
- **Separate conditions**: Prefer multiple if statements over compound conditions
- **Always use curly brackets** even for single statements
- **Ternary operators**: Each part on own line unless very short

```php
if (! $user) {
    return null;
}

if (! $user->isActive()) {
    return null;
}

// Happy path last — process active user...

$name = $isFoo ? 'foo' : 'bar';

$result = $object instanceof Model ?
    $object->name :
    'A default value';
```

### Comments

Code should be self-documenting. Comments only for *why*, never for *what*.

```php
// BAD:
// Get the failed checks for this site
$checks = $site->checks()->where('status', 'failed')->get();

// GOOD:
$failedChecks = $site->checks()->where('status', 'failed')->get();
```

- Don't add comments that describe what the code does
- Use descriptive variable names instead of generic names + comments
- Never add comments to tests — test names should be descriptive enough

### Whitespace

- Add blank lines between statements for readability
- Exception: sequences of equivalent single-line operations
- No extra empty lines between `{}` brackets

### Validation

- Use array notation for multiple rules:
  ```php
  'email' => ['required', 'email'],
  ```
- Prefer DTO validation via Spatie Data over Form Requests for simple cases

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
- Always provide feedback (`$this->comment('All ok!')`)
- Put output BEFORE processing item (easier debugging):
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

### Enums
- PascalCase values

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `PurchaseOrder`, `OrderStatus` |
| Methods/Variables | camelCase | `getUserName`, `$firstName` |
| Routes | kebab-case | `/purchase-orders` |
| Config keys | snake_case | `woocommerce.api_key` |
| Commands | kebab-case | `sync-products` |
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
