# Greenhouse standalone — architecture map

Lightweight onboarding guide: **domain → routes → data access → UI**.

## Domain modules

| Domain | Route paths | Data access entrypoint | Typical UI |
|--------|-------------|-------------------------|------------|
| Analytics | `dashboard`, `reports` | `@app/core/data-access/analytics` (`AnalyticsReportsFacade` + `AnalyticsReportsRepository`) | `DashboardPageComponent`, analytics `ReportsPageComponent` |
| Infrastructure | `locations`, `greenhouses`, `zones`, `systems`, `layers`, `pipes` | `@app/core/data-access/infrastructure` | CRUD list pages + modals (`Gh*` kit) |
| Operations | `batches`, `crops`, `harvest`, `allocations`, `losses` | `@app/core/data-access/operations` | Same pattern; allocations use **use-cases** |
| Sales | `customers`, `invoices`, `sales-reports` | `@app/core/data-access/sales` | CRUD / reports (`SalesReportsFacade`) |
| Settings | `settings` | `@app/core/data-access/settings` | Settings page |

Shell: `MainLayoutComponent` (`gh-main-layout`) hosts `<router-outlet>`; routes under the authenticated parent render inside it.

## Routing

- Authenticated feature routes are grouped under a **parent** route with `canActivate: [authGuard]` (single place to change auth behavior).
- Features load with **`loadComponent`** for lazy chunks.
- Domain route tables live under **`src/app/routes/*.routes.ts`** and are composed in **`app.routes.ts`** (easier ownership per team/domain).

## Data access naming

- Prefer **domain-specific class names** so repositories/facades never collide (`SalesReportsRepository` / `AnalyticsReportsRepository`, `SalesReportsFacade` / `AnalyticsReportsFacade`).
- Import from **domain barrels**, not the deprecated mega-barrel in `core/data-access/index.ts`.
- Analytics reports UI reads data only through **`AnalyticsReportsFacade`** (repository holds mock/API wiring).

### Facades, repositories, and use-cases

- **Facade → one repository**: default for a single aggregate or list CRUD orchestration (signals, filters, modal state).
- **Use-case**: when coordination spans **multiple repositories**, **business rules** are non-trivial, or logic is **reused** by more than one facade or UI path (`operations` already uses this pattern).
- Keep **facades thin**: move multi-repo flows to injectable use-cases under **`core/data-access/<domain>/use-cases`**.

### Analytics reports and `environment.analyticsReportsUseHttp`

- Default **`analyticsReportsUseHttp: false`** keeps **fixture** summaries and cost matrix in **`AnalyticsReportsRepository`** even when **`dataMode` is `live`**, so Reports is not an empty grid.
- After the HTTP contract is stable, set **`analyticsReportsUseHttp: true`** and implement **`HttpClient`** in that repository. Until then the repo **warns in the console** and returns **`[]`** when the flag is on without HTTP, so misconfiguration is noticeable.

## Shared UI

- Design-system-style components live under `@app/shared/components` (`Gh*` aliases).
- **`TranslationService`** is provided from **`@app/core`** (injectable). **`TranslatePipe`** / date pipes stay under **`@app/shared/pipes`** — do not import the service from `shared/pipes`.

### Page import bundles (`@app/shared/page-imports`)

- **`CRUD_LIST_PAGE_IMPORTS_STANDARD`** — list + filters + empty + table + modal/form/delete-confirm (most infrastructure/operations/sales CRUD screens).
- **`CRUD_LIST_PAGE_IMPORTS_WITH_PROGRESS`** — same plus **`GhProgressBarComponent`** (zones, greenhouses, occupancy-style tables).
- **`SALES_CUSTOMERS_PAGE_IMPORTS`**, **`SALES_INVOICES_PAGE_IMPORTS`**, **`SALES_REPORTS_PAGE_IMPORTS`** — sales-specific subsets.
- **`features/infrastructure/infrastructure-crud.imports.ts`** re-exports **`CRUD_LIST_PAGE_IMPORTS_*`** under the old **`INFRASTRUCTURE_CRUD_PAGE_IMPORTS_*`** names for compatibility; **prefer importing from `@app/shared/page-imports`** in new code.

### CRUD page layout

- Use **`GhCrudPageShellComponent`** (`gh-crud-page-shell`) with slots **`data-gh-crud-slot="header"`**, **`filters`**, **`body`** so **RTL** and **vertical spacing** stay consistent across CRUD pages (same order: header → filters → list card → modals).
- Reuse **`GhEntityListSectionComponent`** for the repeated **loading / empty / table** branch instead of copying `@if / @else` blocks in every template.

## Mutations vs list GET

- Infrastructure CRUD facades use **`subscribeMutationWithResult`** / **`subscribeMutationWithVoid`** (`entity-list-facade.helpers.ts`): after POST/PUT the **response body** (including server **`id`**) is merged into **`#items`** — **no extra `getAll`** for refresh. **`subscribeMutationReloadList`** remains available if a domain must refetch the full page after a mutation.

## CRUD pages & modal ↔ form sync

- Default: **`syncCrudModalForm`** (`@app/shared/utils/sync-crud-modal-form`) — closed modal resets defaults; open + row patches; open + create (no row) resets defaults.
- **Greenhouses**: passes **`schedule`** (`queueMicrotask` + `ChangeDetectorRef.markForCheck`) so selects/options stay in sync with OnPush after patch/reset.
- **Customers (sales)**: same helper; facade already exposes **`isModalOpen`** / **`editingItem`** aligned with create/edit flows.

## Styles

- Global tokens/typography/globals live under `src/assets/styles/`.
- Shared **page shell** styles live under **`src/assets/styles/page-shell/`**, aggregated via **`_page-shell.scss`**, loaded from `src/styles.scss`.
- Filter/select focus/surface repetition uses mixins **`shell-field-focus`** and **`shell-select-surface`** in **`_mixins.scss`** (included from `page-shell/_filters.scss`).

## Module boundaries

- Run **`node ./tools/check-boundaries.mjs`** (also **`npm run check:boundaries`**). Rules include: no cross-import between **`features/<domainA>`** and **`features/<domainB>`** via `@app/features/...` — share code through **`core`** or **`shared`**.
- ESLint (**`npm run lint`**) applies **`no-restricted-imports`** on **`src/app/features/**`** and **`src/app/shared/**`** (root **`@app/core/data-access`** barrel, **`@app/core/data-access/api`**, **`@app/core/models/api-types`**, **`@app/features`** from shared). **Deep** imports like `.../repositories/...` are still enforced only by **`check-boundaries.mjs`** (ESLint glob patterns for those are brittle).

## i18n

- Prefer **scoped keys**: **`zones.*`**, **`greenhouses.*`**, **`pipes.*`**, **`customers.*`**, **`locations.*`**, **`common.*`**, … (one logical prefix tree per screen or subdomain).
- Run **`npm run check:i18n`** before release; it fails on **empty** leaf values and prints namespace counts (JSON cannot duplicate keys — watch merge conflicts in **`en.json`**).

## Testing convention

- **`operations` use-cases**: each implementation has a **`*.use-case.spec.ts`** beside it.
- **Facades**: add focused specs when they orchestrate HTTP/state (**`analytics-reports`**, **`locations`**, **`customers`**, **`greenhouses`**, **`invoices`**). Expand coverage when production defects appear on critical screens.
