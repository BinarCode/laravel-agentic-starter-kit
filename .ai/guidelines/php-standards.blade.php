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

@boostsnippet('Generics for iterables', 'php')
/** @return Collection<int, User> */
public function getUsers(): Collection
{
    // ...
}
@endboostsnippet

@boostsnippet('Import classnames in docblocks', 'php')
use \Spatie\Url\Url;
/** @return Url */
@endboostsnippet

@boostsnippet('Array param types', 'php')
/**
 * @param array<int, MyObject> $myArray
 * @param int $typedArgument
 */
function someFunction(array $myArray, int $typedArgument) {}
@endboostsnippet

@boostsnippet('Array shape notation', 'php')
/** @return array{
   first: SomeClass,
   second: SomeClass
} */
@endboostsnippet

## Control Flow

- **Happy path last**: Handle error conditions first, success case last
- **Avoid else**: Use early returns instead of nested conditions
- **Separate conditions**: Prefer multiple if statements over compound conditions
- **Always use curly brackets** even for single statements
- **Ternary operators**: Each part on own line unless very short

@boostsnippet('Happy path last pattern', 'php')
if (! $user) {
    return null;
}

if (! $user->isActive()) {
    return null;
}

// Happy path last — process active user...
return $user->process();
@endboostsnippet

@boostsnippet('Ternary patterns', 'php')
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
@endboostsnippet

## Comments

Code should be self-documenting. Comments only for *why*, never for *what*. Adding comments should never be the first tactic to make code readable.

@boostsnippet('Self-documenting code over comments', 'php')
// BAD:
// Get the failed checks for this site
$checks = $site->checks()->where('status', 'failed')->get();

// GOOD:
$failedChecks = $site->checks()->where('status', 'failed')->get();
@endboostsnippet

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

@boostsnippet('Validation array notation', 'php')
public function rules(): array
{
    return [
        'email' => ['required', 'email'],
    ];
}
@endboostsnippet

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

@boostsnippet('Artisan command output pattern', 'php')
$items->each(function(Item $item) {
    $this->info("Processing item id `{$item->id}`...");
    $this->processItem($item);
});

$this->comment("Processed {$items->count()} items.");
@endboostsnippet

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
