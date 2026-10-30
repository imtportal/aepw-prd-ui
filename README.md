# AEPW IMT Portal

Impact Management & Tracking portal for the Alliance to End Plastic Waste. Built with Angular 20.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 20 (standalone components, signals, zoneless) |
| Styling | Tailwind CSS 3 + custom HSL design tokens |
| UI Components | PrimeNG 20 (Aura theme, customised preset) |
| Icons | Lucide Angular |
| Tables | Shared `DataTableComponent` (server-side pagination & sorting) |
| HTTP | Angular `HttpClient` with mock fallback via `catchError` |
| State | Angular signals (`signal`, `computed`, `linkedSignal`) |
| Forms | Angular Reactive Forms + template-driven (`ngModel`) |
| Node | 22.x |
| Package Manager | npm 10 |

---

## Prerequisites

- Node.js 22.x
- npm 10.x

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4200)
npm start

# Build for production
npm run build

# Run tests
npm test

# Watch build (rebuilds on file change)
npm run watch
```

---

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── interceptors/       # auth, error, loading interceptors
│   │   ├── layout/             # AppShell, Sidebar, Header
│   │   └── models/             # shared API models (PagedRequest, PaginatedResponse)
│   │
│   ├── features/
│   │   ├── dashboard/          # Reviews dashboard with filters & Impact by Category cards
│   │   ├── reviews/            # Review detail, create, bulk-launch workflows
│   │   ├── evidence/           # Evidence tracking, upload, AI confidence review
│   │   ├── ai-processing/      # AI document processing queue
│   │   ├── reviewer/           # Reviewer approval queue (tabbed by stage)
│   │   ├── reporting/          # Impact reporting with drill-down (AEPW → Program → Project)
│   │   ├── audit/              # Audit timeline
│   │   └── admin/
│   │       ├── projects/       # Project master list & detail sheet
│   │       ├── users/          # User management
│   │       ├── metrics/        # Metric configuration
│   │       └── settings/       # System settings
│   │
│   └── shared/
│       ├── ui/                 # Reusable UI components (see below)
│       └── utils/              # cn(), date utils, confidence constants
│
├── environments/
│   ├── environment.ts          # dev  → apiBaseUrl: http://localhost:3000/api
│   └── environment.prod.ts     # prod → set apiBaseUrl before deploying
│
└── styles/
    ├── styles.css              # Tailwind directives + global overrides
    └── tokens.css              # HSL CSS custom properties (design tokens)
```

---

## Shared UI Components

All components are standalone and live in `src/app/shared/ui/`.

| Component | Selector | Notes |
|---|---|---|
| DataTable | `<ui-data-table>` | Generic paginated/sorted table |
| Card | `<ui-card>` | Card shell with header, content, title |
| Badge | `<ui-badge>` | Inline status chip |
| Button | `<ui-button>` | CVA button with variants |
| Select | `<ui-select>` | Native `<select>` styled to design system |
| SearchInput | `<ui-search-input>` | Search field with leading icon |
| Sheet | `<ui-sheet>` | Slide-over drawer (PrimeNG Drawer) |
| Dialog | `<ui-dialog>` | Modal dialog (PrimeNG Dialog) |
| Tabs | `<ui-tabs>` | Tab group with `<ui-tab-panel>` |
| Accordion | `<ui-accordion>` | Collapsible sections |
| Toggle | `<ui-toggle>` | Boolean on/off switch |
| Progress | `<ui-progress>` | Horizontal progress bar |
| Tooltip | `[uiTooltip]` | Directive — wraps any element |

---

## Data Table Pattern

All tables use `<ui-data-table>` with server-side pagination (default 10 rows, options 20 / 50).

**Component class:**

```typescript
tableColumns: DataColumn[] = [
  { key: 'id',   header: 'ID',      sortable: true },
  { key: 'name', header: 'Project', sortable: true },
];

pageData  = signal<MyType[]>([]);
pageTotal = signal(0);
loading   = signal(false);

onPageChange(params: PagedRequest): void {
  this.loading.set(true);
  this.service.loadPaged(params).subscribe({
    next: res => {
      this.pageData.set(res.data);
      this.pageTotal.set(res.total);
      this.loading.set(false);
    },
    error: () => this.loading.set(false),
  });
}
```

**Template:**

```html
<ui-data-table
  [columns]="tableColumns"
  [data]="pageData()"
  [total]="pageTotal()"
  [loading]="loading()"
  [rowTemplate]="myRow"
  (pageChange)="onPageChange($event)" />

<ng-template #myRow let-item>
  <tr class="border-b hover:bg-muted/30">
    <td class="px-4 py-3 text-sm">{{ item.id }}</td>
    <td class="px-3 py-3 text-sm font-medium">{{ item.name }}</td>
  </tr>
</ng-template>
```

For input-driven tables (e.g. reporting), use local `signal` + `computed` to slice data client-side instead of calling a service.

---

## API & Mock Data

All services call `environment.apiBaseUrl` and include a `catchError` fallback to in-memory mock data. The UI is fully functional without a backend running.

To connect a real backend, update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://your-api.example.com/api',
};
```

---

## Design Tokens

Defined in `src/styles/tokens.css`, consumed as `hsl(var(--token))` throughout.

| Token | Purpose |
|---|---|
| `--aepw-blue` | Primary brand colour |
| `--aepw-green` | Success / validated states |
| `--aepw-orange` | Warning / review states |
| `--aepw-light-blue` | Secondary accent |
| `--aepw-dark-grey` | Closed / inactive states |
| `--radius` | Global border radius |

---

## Routing

| Path | Feature |
|---|---|
| `/` | Dashboard |
| `/reviews` | Reviews list |
| `/reviews/create` | Create review wizard |
| `/reviews/bulk-launch` | Bulk launch reviews |
| `/reviews/:id` | Review detail |
| `/evidence` | Evidence tracking |
| `/ai-processing` | AI processing queue |
| `/reviewer` | Reviewer approval queue |
| `/reporting` | Impact reporting |
| `/audit` | Audit log |
| `/admin/projects` | Project master |
| `/admin/users` | User management |
| `/admin/metrics` | Metric configuration |
| `/admin/settings` | System settings |
