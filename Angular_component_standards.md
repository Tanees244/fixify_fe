# Angular Production-Ready Component Standards

A living reference for building components that are maintainable, consistent, and shippable. Every rule here exists because something broke in production without it.

---

## Table of Contents

1. [File & Folder Structure](#1-file--folder-structure)
2. [Component Architecture](#2-component-architecture)
3. [Forms — Validation & Inline Errors](#3-forms--validation--inline-errors)
4. [Modals & Dialogs](#4-modals--dialogs)
5. [API Calls — Loading, Errors, Success](#5-api-calls--loading-errors-success)
6. [Toast Notifications](#6-toast-notifications)
7. [Button States](#7-button-states)
8. [UI Consistency Rules](#8-ui-consistency-rules)
9. [Accessibility (a11y) Minimums](#9-accessibility-a11y-minimums)
10. [Performance Checklist](#10-performance-checklist)
11. [Code Quality & Naming](#11-code-quality--naming)
12. [Security](#12-security)
13. [Pre-Ship Checklist](#13-pre-ship-checklist)

---

## 1. File & Folder Structure

### Feature Folder Layout

Every feature owns its folder. Nothing leaks out unless it goes into `shared/`.

```
src/app/
├── features/
│   └── invoices/
│       ├── invoices.routes.ts            ← lazy-loaded route config
│       ├── invoices-list/
│       │   ├── invoices-list.component.ts
│       │   ├── invoices-list.component.html
│       │   └── invoices-list.component.scss
│       ├── modals/
│       │   ├── create-invoice-modal/
│       │   │   ├── create-invoice-modal.component.ts
│       │   │   └── create-invoice-modal.component.html
│       │   └── delete-invoice-modal/
│       │       ├── delete-invoice-modal.component.ts
│       │       └── delete-invoice-modal.component.html
│       └── invoices.service.ts
│
├── shared/
│   ├── components/
│   │   ├── confirm-delete-modal/         ← reused across features
│   │   ├── searchable-select/
│   │   └── data-table/
│   ├── services/
│   │   └── toast.service.ts
│   └── directives/
│       └── trim-input.directive.ts
```

### Rules

- **One component per file.** No exceptions.
- **Modals live in a `modals/` subfolder** inside their feature — not inline inside the parent component file.
- **If two or more features need the same modal** (e.g. a generic confirm-delete), move it to `shared/components/`.
- **Services stay at the feature level** unless consumed by 2+ features — then promote to `shared/services/`.
- **Never import a feature's internal component from another feature.** Route to it or promote it to shared.

---

## 2. Component Architecture

### Standalone Components (Angular 17+)

Always use standalone. No NgModules for new code.

```typescript
@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SearchableSelectComponent],
  templateUrl: './invoice-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,   // ← always
})
export class InvoiceFormComponent {
  // signals > properties for reactive state
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
}
```

### Change Detection

Always set `ChangeDetectionStrategy.OnPush`. If you need to trigger a re-render manually, inject `ChangeDetectorRef` and call `markForCheck()`. Using `Default` is a flag that something is architecturally wrong.

### Smart vs Dumb Components

| Type | Responsibility | Has Service Injection? |
|------|---------------|----------------------|
| Smart (container) | Fetches data, handles routing, orchestrates | Yes |
| Dumb (presentational) | Renders UI, emits events upward | No — inputs/outputs only |

A form inside a modal is almost always a dumb component. The modal opener (the page) is the smart component.

### Inputs & Outputs

```typescript
// Use the new signal-based input API
readonly invoice = input<Invoice | null>(null);
readonly mode = input<'create' | 'edit'>('create');

// Outputs
readonly saved = output<Invoice>();
readonly cancelled = output<void>();
```

Never pass a service into a dumb component. Pass data in, get events out.

---

## 3. Forms — Validation & Inline Errors

### Setup

Always use **Reactive Forms**. Template-driven forms are not acceptable for anything beyond a single search input.

```typescript
protected readonly form = new FormGroup({
  name: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
  }),
  email: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  }),
  amount: new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0.01)],
  }),
});
```

### Inline Error Display Rules

1. **Show errors only after the field has been touched** — never on load.
2. **Show errors immediately on blur** — do not wait for form submit.
3. **On submit attempt, mark all fields as touched** so all errors surface at once.
4. **One error message at a time** per field — show the most specific one.

```html
<!-- Field wrapper pattern — use this consistently across ALL form fields -->
<div class="form-field">
  <label for="email" class="form-label">
    Email <span class="required-star" aria-hidden="true">*</span>
  </label>

  <input
    id="email"
    type="email"
    formControlName="email"
    class="form-input"
    [class.form-input--error]="isFieldInvalid('email')"
    autocomplete="email"
    aria-describedby="email-error"
  />

  @if (isFieldInvalid('email')) {
    <p id="email-error" class="field-error" role="alert">
      {{ getFieldError('email') }}
    </p>
  }
</div>
```

```typescript
// Reusable helpers — put these in every smart form component or a base class
protected isFieldInvalid(name: string): boolean {
  const ctrl = this.form.get(name);
  return !!(ctrl?.invalid && ctrl.touched);
}

protected getFieldError(name: string): string {
  const ctrl = this.form.get(name);
  if (!ctrl?.errors) return '';

  const { required, minlength, maxlength, email, min, max, pattern } = ctrl.errors;

  if (required)   return 'This field is required.';
  if (email)      return 'Please enter a valid email address.';
  if (minlength)  return `Minimum ${minlength.requiredLength} characters required.`;
  if (maxlength)  return `Maximum ${maxlength.requiredLength} characters allowed.`;
  if (min)        return `Minimum value is ${min.min}.`;
  if (max)        return `Maximum value is ${max.max}.`;
  if (pattern)    return 'Invalid format.';

  return 'Invalid value.';
}

protected markAllTouched(): void {
  this.form.markAllAsTouched();
}
```

### Server-Side Field Errors

Map API validation errors back to form controls:

```typescript
private applyServerErrors(errors: Record<string, string>): void {
  Object.entries(errors).forEach(([field, message]) => {
    this.form.get(field)?.setErrors({ serverError: message });
    this.form.get(field)?.markAsTouched();
  });
}

// In getFieldError(), add:
if (ctrl.errors?.['serverError']) return ctrl.errors['serverError'];
```

---

## 4. Modals & Dialogs

### Rule: One Modal = One Component File

Never write a modal inline inside a parent component's template using `*ngIf` on a big `<div>`. Always extract it.

### Single Modal (feature-specific)

```typescript
// create-invoice-modal.component.ts
@Component({
  selector: 'app-create-invoice-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-invoice-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateInvoiceModalComponent {
  readonly isOpen = input.required<boolean>();
  readonly saved = output<Invoice>();
  readonly closed = output<void>();

  // form + submit logic lives here, not in the parent
}
```

```html
<!-- In parent template -->
<app-create-invoice-modal
  [isOpen]="showCreateModal()"
  (saved)="onInvoiceSaved($event)"
  (closed)="showCreateModal.set(false)"
/>
```

### Multiple Modals in One Feature

If a page opens 3 different modals, create a `modals/` subfolder and give each its own component. In the parent:

```typescript
// Signals for each modal — clean and readable
protected readonly showCreateModal  = signal(false);
protected readonly showEditModal    = signal(false);
protected readonly showDeleteModal  = signal(false);
protected readonly selectedInvoice  = signal<Invoice | null>(null);

protected openEditModal(invoice: Invoice): void {
  this.selectedInvoice.set(invoice);
  this.showEditModal.set(true);
}
```

### Shared/Generic Modals

A confirm-delete modal is used everywhere. Put it in `shared/components/confirm-delete-modal/`:

```typescript
// confirm-delete-modal.component.ts
@Component({ ... })
export class ConfirmDeleteModalComponent {
  readonly isOpen        = input.required<boolean>();
  readonly title         = input('Delete item');
  readonly message       = input('This action cannot be undone.');
  readonly confirmLabel  = input('Delete');
  readonly isDeleting    = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
```

```html
<!-- Usage anywhere -->
<app-confirm-delete-modal
  [isOpen]="showDeleteModal()"
  title="Delete Invoice"
  [message]="'Invoice #' + selectedInvoice()?.number + ' will be permanently removed.'"
  [isDeleting]="isDeletingInvoice()"
  (confirmed)="onDeleteConfirmed()"
  (cancelled)="showDeleteModal.set(false)"
/>
```

### Modal Behaviour Requirements

- Pressing `Escape` must close the modal — always.
- Clicking the backdrop must close the modal — always.
- Focus must be trapped inside an open modal.
- When a modal closes, focus must return to the element that opened it.
- Scroll on the body must be locked while a modal is open (`overflow: hidden` on `<body>`).
- The modal must have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the heading.

---

## 5. API Calls — Loading, Errors, Success

### The Standard Pattern

Every API call in a component follows this exact shape:

```typescript
protected async submitForm(): Promise<void> {
  // 1. Validate first — never hit the API with invalid data
  if (this.form.invalid) {
    this.markAllTouched();
    return;
  }

  // 2. Set loading state
  this.isSubmitting.set(true);
  this.serverError.set(null);

  try {
    const payload = this.form.getRawValue();
    const result = await firstValueFrom(this.invoiceService.create(payload));

    // 3. Success path
    this.toastService.success('Invoice created successfully.');
    this.saved.emit(result);
    this.closed.emit();

  } catch (error: unknown) {
    // 4. Error path
    const apiError = error as ApiError;

    if (apiError.status === 422 && apiError.fieldErrors) {
      // Map validation errors back to form fields
      this.applyServerErrors(apiError.fieldErrors);
    } else {
      // Generic error — show in toast AND optionally inline
      this.serverError.set(apiError.message ?? 'Something went wrong. Please try again.');
      this.toastService.error('Failed to create invoice.');
    }
  } finally {
    // 5. Always reset loading regardless of outcome
    this.isSubmitting.set(false);
  }
}
```

### HTTP Error Interceptor

Handle common HTTP errors globally — do not repeat this in every component:

```typescript
// http-error.interceptor.ts
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        inject(AuthService).logout();
      }
      if (error.status === 403) {
        inject(Router).navigate(['/forbidden']);
      }
      if (error.status >= 500) {
        inject(ToastService).error('A server error occurred. Please try again later.');
      }
      return throwError(() => error);
    }),
  );
};
```

### API Error Type

Define a typed error shape so components don't cast to `any`:

```typescript
export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}
```

---

## 6. Toast Notifications

### When to Show a Toast

| Scenario | Toast Type | Message Style |
|----------|-----------|---------------|
| Record created | success | "Invoice created." |
| Record updated | success | "Changes saved." |
| Record deleted | success | "Invoice deleted." |
| Network / server error | error | "Something went wrong. Please try again." |
| Validation error (form) | — | No toast — inline errors are enough |
| Action that takes time (export) | info | "Generating export…" → then success/error |
| Non-critical warning | warning | "Session expires in 5 minutes." |

### Toast Service Interface

```typescript
export interface ToastService {
  success(message: string, duration?: number): void;
  error(message: string, duration?: number): void;
  info(message: string, duration?: number): void;
  warning(message: string, duration?: number): void;
}
```

### Rules

- Toasts auto-dismiss after **4 seconds** for success/info, **6 seconds** for error/warning.
- Errors must also have a manual close button — do not rely solely on auto-dismiss.
- Never show more than **3 toasts** at once. Queue them.
- Position: **bottom-right** on desktop, **bottom-center** on mobile.
- Never use `alert()` or `window.confirm()`. Ever.

---

## 7. Button States

Every button that triggers an async action must cycle through these states:

```
idle → loading → idle (success path closes the modal or resets)
                → error (button returns to idle, error is shown)
```

### Button Component Requirements

```html
<!-- Primary action button -->
<button
  type="submit"
  class="btn btn--primary"
  [disabled]="isSubmitting() || form.invalid"
  (click)="submitForm()"
>
  @if (isSubmitting()) {
    <span class="btn-spinner" aria-hidden="true"></span>
    <span>Saving…</span>
  } @else {
    <span>Save Invoice</span>
  }
</button>

<!-- Destructive action button -->
<button
  type="button"
  class="btn btn--danger"
  [disabled]="isDeleting()"
  (click)="onDelete()"
>
  @if (isDeleting()) {
    <span class="btn-spinner" aria-hidden="true"></span>
    <span>Deleting…</span>
  } @else {
    <i class="ti ti-trash" aria-hidden="true"></i>
    <span>Delete</span>
  }
</button>

<!-- Cancel button — never disable this -->
<button type="button" class="btn btn--ghost" (click)="onCancel()">
  Cancel
</button>
```

### Button Rules

- **Never disable the cancel button** — the user must always be able to exit.
- **Disable the submit button while submitting** — prevents double-submission.
- **Disable submit while form is pristine and unchanged** on edit forms (prevents no-op API calls).
- **Show a spinner inside the button** — not a full-page overlay for form submissions.
- Full-page loaders are only for initial page data fetches, not for user-action API calls.
- **Never change button width on loading state** — the spinner replaces the label, it does not expand the button. Set a min-width on buttons that show loading state.

---

## 8. UI Consistency Rules

These are non-negotiable. Inconsistency is a bug.

### Spacing

Use a spacing scale. Never use arbitrary pixel values outside of the scale.

```scss
// Use Tailwind classes or define a scale:
// 4px (gap-1), 8px (gap-2), 12px (gap-3), 16px (gap-4),
// 24px (gap-6), 32px (gap-8), 48px (gap-12), 64px (gap-16)
```

### Typography

- **Headings:** One `h1` per page. Modal titles are `h2`. Section titles inside modals are `h3`.
- **Body text:** One base font size. Never mix 13px, 14px, and 15px arbitrarily — pick one for body and stick to it.
- **Labels:** All form labels same size, same weight, same color.

### Colors

- Define a design token set. No hardcoded hex values in component styles.
- Error state: one red — `var(--color-danger)`.
- Success state: one green — `var(--color-success)`.
- Primary action: one blue — `var(--color-primary)`.
- If the design system has a color variable for it, use the variable. Never reach for `#ef4444` directly.

### Form Field Anatomy

Every single form field across the entire application must look the same:

```
[Label]          ← 14px, font-medium, color-text-secondary
[Input / Select] ← consistent height (36px or 40px — pick one), border-radius, border-color
[Helper text]    ← 12px, color-text-tertiary (optional)
[Error message]  ← 12px, color-danger, with a ⚠ icon prefix
```

### Interactive States

Every interactive element must have all four states styled:

| State | Requirement |
|-------|-------------|
| Default | Base style |
| Hover | Subtle background shift or border color change |
| Focus | Visible focus ring — **never** `outline: none` without a replacement |
| Disabled | `opacity: 0.5`, `cursor: not-allowed`, pointer events off |
| Loading | Spinner visible, element disabled |

### Empty States

Every list, table, or data grid must handle the empty state explicitly:

```html
@if (invoices().length === 0 && !isLoading()) {
  <div class="empty-state">
    <i class="ti ti-file-invoice" aria-hidden="true"></i>
    <p class="empty-state__title">No invoices yet</p>
    <p class="empty-state__description">Create your first invoice to get started.</p>
    <button class="btn btn--primary" (click)="openCreateModal()">Create Invoice</button>
  </div>
}
```

### Skeleton Loaders vs Spinners

- **Skeleton loaders** for initial page data (tables, cards, profile data).
- **Inline spinners inside buttons** for user-triggered actions.
- **Full-page spinner** only for route-level lazy loading — and only if you cannot show a skeleton.

---

## 9. Accessibility (a11y) Minimums

These are not optional. They are a production requirement.

- All form inputs must have a `<label>` with `for` matching the input `id`. No placeholder-only labels.
- All interactive elements must be keyboard reachable and operable.
- Never remove `outline` on focus without providing a visible alternative (`box-shadow` focus ring is fine).
- All images must have descriptive `alt` text. Decorative images get `alt=""`.
- Use `aria-describedby` to link error messages to their inputs.
- Use `role="alert"` on dynamically injected error messages so screen readers announce them.
- Color alone must never be the only way to convey meaning (e.g. error state needs an icon + color, not color alone).
- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text and UI components.
- Modals must trap focus. Use Angular CDK `A11yModule` and `FocusTrap`.

---

## 10. Performance Checklist

### Change Detection

- `ChangeDetectionStrategy.OnPush` on every component.
- Use signals for local state — they integrate with OnPush automatically.
- Avoid calling functions in templates (`{{ getLabel() }}`). Use `computed()` signals or pipes instead.
- Avoid `async` pipe with complex observables in tight loops. Prefer `toSignal()`.

### Lazy Loading

- Every feature route must be lazy loaded.
- Modals that are large or contain heavy forms should use `@defer` to load only when opened.

```html
@defer (when showCreateModal()) {
  <app-create-invoice-modal ... />
}
```

### Lists & Tables

- Use `trackBy` (or `track` in `@for`) on all list renders — always.
- Virtual scroll for lists over 100 items (Angular CDK `ScrollingModule`).
- Paginate server-side for lists that could grow unbounded.

### Subscriptions

- Use `takeUntilDestroyed()` for all manual subscriptions inside components.
- Prefer `toSignal()` over `async` pipe for observables that feed component state.

---

## 11. Code Quality & Naming

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Component selector | `app-` prefix, kebab-case | `app-invoice-form` |
| Component class | PascalCase + `Component` | `InvoiceFormComponent` |
| Service class | PascalCase + `Service` | `InvoiceService` |
| Signal (protected) | camelCase noun | `isSubmitting`, `invoices` |
| Output event | camelCase verb past tense | `saved`, `deleted`, `cancelled` |
| Method (user action) | `on` + PascalCase noun | `onSubmit`, `onDelete` |
| Method (internal) | camelCase verb phrase | `applyServerErrors`, `buildForm` |
| Template variable | `#camelCase` | `#triggerBtn`, `#searchInput` |

### Method Length

If a method exceeds ~25 lines, split it. Each method should do one thing and be nameable in a single sentence.

### No Magic Numbers or Strings

```typescript
// Bad
if (error.status === 422) { ... }
this.toast.show('success', 3000);

// Good
const HTTP_UNPROCESSABLE = 422;
const TOAST_DURATION_MS  = 3000;
if (error.status === HTTP_UNPROCESSABLE) { ... }
```

### Template Complexity

- No ternary operators longer than one line in templates. Move to `computed()` or a getter.
- No nested `@for` inside `@for` without a strong reason. Flatten the data in the component.
- No logic in template expressions beyond simple `?.` access and signal calls. Complex expressions belong in `computed()`.

---

## 12. Security

- **Never use `[innerHTML]`** with unsanitized user content. If you must, use Angular's `DomSanitizer.sanitize()`.
- **Never store tokens in `localStorage`**. Use `httpOnly` cookies or in-memory storage.
- **Sanitize all route parameters** before using them in API calls or display.
- **CSRF tokens** must be included on all mutating requests (POST, PUT, PATCH, DELETE). The Angular `HttpClient` does this automatically for same-origin requests if the backend sets the cookie correctly.
- Set `Content-Security-Policy` headers. Do not disable them for convenience.

---

## 13. Pre-Ship Checklist

Before any component is marked "done", verify every item:

### Forms
- [ ] All fields have labels (not placeholder-only)
- [ ] Required fields are marked visually and with `aria-required`
- [ ] Inline errors show on touch, not on load
- [ ] All errors surface on submit attempt
- [ ] Server validation errors map back to individual fields
- [ ] Submitting with an empty/invalid form does not hit the API

### API Calls
- [ ] Submit button shows spinner and is disabled while loading
- [ ] Cancel button is never disabled
- [ ] Success triggers a toast with a clear message
- [ ] Network errors trigger a toast and inline error if relevant
- [ ] `finally` block always resets the loading signal

### Modals
- [ ] Modal is its own component file
- [ ] `Escape` closes the modal
- [ ] Backdrop click closes the modal
- [ ] Focus is trapped inside
- [ ] Focus returns to the opener on close
- [ ] Body scroll is locked when modal is open
- [ ] `role="dialog"` and `aria-labelledby` are set

### UI/UX
- [ ] Empty states are handled
- [ ] Skeleton loaders for initial data fetches
- [ ] All interactive elements have hover, focus, and disabled states
- [ ] No hardcoded colours or magic numbers
- [ ] `ChangeDetectionStrategy.OnPush` is set
- [ ] `track` is used in all `@for` loops
- [ ] All subscriptions are cleaned up with `takeUntilDestroyed()`

### Accessibility
- [ ] Keyboard navigable
- [ ] Focus ring visible on all interactive elements
- [ ] Error messages use `role="alert"`
- [ ] Colour is not the sole indicator of state
- [ ] Contrast ratios pass WCAG AA

---

*Last updated: 2025. Treat every item here as a default, not a suggestion. Deviations need a written reason.*
