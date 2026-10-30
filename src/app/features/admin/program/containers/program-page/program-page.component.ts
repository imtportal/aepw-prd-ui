import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ProgramLookup } from '../../../../../core/models/lookup-model';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LookupService } from '../../../../../core/services/lookup-service';
import { PageLoadingService } from '../../../../../core/services/page-loading.service';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  Plus,
  Settings2,
} from 'lucide-angular';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { SelectComponent } from '../../../../../shared/ui/select/select.component';
import {
  DataColumn,
  DataTableComponent,
} from '../../../../../shared/ui/data-table/data-table.component';
import { PagedRequest } from '../../../../../core/models/api-response.model';
import { ProgramModel } from '../../models/program.model';
import { Router } from '@angular/router';
import { ProgramService } from '../../services/program.service';
import { AuthorizationService, AuthStateService } from '../../../../../core/auth';
import { ActionAccess } from '../../../../../core/auth/models/authorization.model';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: '',
  standalone: true,
  imports: [
    FormsModule,
    NgSelectModule,
    LucideAngularModule,
    ButtonComponent,
    CardComponent,
    CardContentComponent,
    SelectComponent,
    DataTableComponent,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Plus,
        Settings2,
      }),
    },
  ],
  templateUrl: './program-page.component.html',
})
export class ProgramPageComponent implements OnInit {
  private readonly pageLoadingService = inject(PageLoadingService);
  readonly ngSelectVersion = signal(0);
  private readonly authStateService = inject(AuthStateService);
  private readonly authorizationService = inject(AuthorizationService);
  readonly actionAccess = signal<ActionAccess[]>([]);
  private readonly pageKey = 'PROGRAMMANAGEMENT';
  protected readonly canAddProgram = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'ADD' && action.value);

    console.log('ADD button access:', result);

    return result;
  });
  protected readonly canEditProgram = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'EDIT' && action.value);

    console.log('EDIT button access:', result);

    return result;
  });
  ///////////////////////////////////////////////////////
  private readonly translocoService = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly programService = inject(ProgramService);
  private router = inject(Router);
  readonly totalRecords = signal(0);
  readonly totalPages = signal(0);
  private readonly _allPrograms = signal<ProgramModel[]>([]);
  readonly searchText = signal('');
  private readonly _currentPage = signal(0);

  private readonly _pageSize = signal(10);
  readonly pageData = computed(() => this._allPrograms());

  readonly pageTotal = computed(() => this.totalRecords());
  readonly loading = signal(false);
  private readonly lookupService = inject(LookupService);
  readonly selectedProgramId = signal<string | null>(null);
  readonly programSearch$ = new Subject<string>();

  readonly programLookups = signal<ProgramLookup[]>([]);

  readonly statusOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  readonly selectedStatus = signal<boolean | null>(null);
  readonly tableColumns: DataColumn[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      width: '15%',
    },
    {
      key: 'name',
      header: 'Program Name',
      sortable: true,
      width: '15%',
    },
    {
      key: 'description',
      header: 'Description',
      width: '55%',
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      align: 'center',
      width: '15%',
    },
  ];
  ngOnInit(): void {
    this.pageLoadingService.stop();
    // this.loading.set(true);
    this.loadActionAccess();
    this.refreshPrograms();
    this.programSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          const searchTerm = term?.trim() ?? '';

          if (searchTerm.length < 3) {
            return of<ProgramLookup[]>([]);
          }

          return this.lookupService.getPrograms(searchTerm).pipe(
            map((response) => response.data ?? []),
            catchError((error) => {
              console.error('[Program Typeahead]', error);
              return of<ProgramLookup[]>([]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((programs) => {
        this.programLookups.set(programs);
      });
  }
  applyFilters(): void {
    this._currentPage.set(0);
    this.refreshPrograms();
  }
  clearFilters(): void {
    this.searchText.set('');
    this.selectedProgramId.set(null);
    this.programLookups.set([]);
    this.programSearch$.next('');
    this.selectedStatus.set(null);

    this._currentPage.set(0);
    this.refreshPrograms();
  }
  private refreshPrograms(): void {
    this.loading.set(true);
    this.programService
      .getAllPrograms({
        pageNumber: String(this._currentPage() + 1),
        pageSize: String(this._pageSize()),
        searchText: this.searchText(),
        programId: this.selectedProgramId(),
        isActive: this.selectedStatus(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          console.log('Finalize called');
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          console.log('Response', response);
          const pagedData = response.data;

          this.totalRecords.set(pagedData.totalRecords);

          this.totalPages.set(pagedData.totalPages);

          this._allPrograms.set(pagedData.items);
        },
        error: (err) => console.error(err),
      });
  }

  private loadActionAccess(): void {
    const userId = this.authStateService.getCurrentUserId();

    if (!userId) {
      console.error('[Authorization] Current user ID not available.');
      return;
    }

    this.authorizationService
      .getActionAccess(this.pageKey, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.actionAccess.set(response.data ?? []);

          console.log('[Authorization] User Management action access:', response.data);
        },
        error: (error) => {
          console.error('[Authorization] Failed to load User Management action access:', error);

          this.actionAccess.set([]);
        },
      });
  }
  onEditProgram(programId: string): void {
    if (!this.canEditProgram()) {
      return;
    }
    console.log('on edit program clicked');
    this.router.navigate(['/admin/programs', programId]);
  }
  onAddProgram() {
    this.router.navigate(['/admin/program-form']);
  }

  onPageChange(params: PagedRequest): void {
    this._currentPage.set(params.page);
    this._pageSize.set(params.pageSize);

    this.refreshPrograms();
  }
  onStatusFilterChange(value: boolean | null): void {
    this.selectedStatus.set(value);
    this._currentPage.set(0);
    this.refreshPrograms();
  }
  onProgramFilterChange(value: string | null): void {
    this.selectedProgramId.set(value);

    if (!value) {
      this.programLookups.set([]);
      this.programSearch$.next('');
    }

    this._currentPage.set(0);
    this.refreshPrograms();
  }
  onSearch(event: any): void {
    console.log('SEARCH EVENT', event.term);
  }
  protected readonly statusColors: Record<string, string> = {
    Active: 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]',
    Inactive: 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',

    Paused: 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',
    Completed: 'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-[hsl(var(--aepw-dark-grey))]',
  };
}
