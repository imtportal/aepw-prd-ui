import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  CountryLookup,
  FundingRecipientLookup,
  StatusLookup,
} from '../../../../../core/models/lookup-model';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LookupService } from '../../../../../core/services/lookup-service';
import { PageLoadingService } from '../../../../../core/services/page-loading.service';
import { FundingRecipientService } from '../../services/funding-recipient.service';
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
import {
  FundingRecipient,
  GetFundingRecipientsRequest,
} from '../../models/funding-recipient.model';
import { Router } from '@angular/router';
import { AuthorizationService, AuthStateService } from '../../../../../core/auth';
import { ActionAccess } from '../../../../../core/auth/models/authorization.model';
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
  templateUrl: './funding-recipient-page.component.html',
})
export class FundingRecipientPageComponent implements OnInit {
  private readonly pageLoadingService = inject(PageLoadingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authStateService = inject(AuthStateService);
  private readonly authorizationService = inject(AuthorizationService);
  readonly actionAccess = signal<ActionAccess[]>([]);
  private readonly pageKey = 'FUNDINGRECIPIENTMANAGEMENT';
  protected readonly canAddFR = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'ADD' && action.value);

    console.log('ADD button access:', result);

    return result;
  });

  protected readonly canEditFR = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'EDIT' && action.value);

    console.log('EDIT button access:', result);

    return result;
  });
  private readonly fundingRecipientService = inject(FundingRecipientService);
  private router = inject(Router);
  readonly fundingRecipients = signal<FundingRecipient[]>([]);
  readonly fundingRecipientLookups = signal<FundingRecipientLookup[]>([]);

  readonly totalRecords = signal(0);
  readonly totalPages = signal(0);
  private readonly _allFundingRecipients = signal<FundingRecipient[]>([]);

  private readonly _currentPage = signal(0);

  private readonly _pageSize = signal(10);
  readonly pageData = computed(() => this._allFundingRecipients());

  readonly pageTotal = computed(() => this.totalRecords());
  readonly loading = signal(false);
  private readonly lookupService = inject(LookupService);
  // readonly countries = signal<CountryLookup[]>([]);
  readonly statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  readonly selectedIsActive = signal<boolean | null>(null);

  readonly selectedFundingRecipientId = signal<string | null>(null);

  readonly tableColumns: DataColumn[] = [
    {
      key: 'orgName',
      header: 'Funding Recipient Organisation',
      sortable: true,
      width: '40%',
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      width: '27%',
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      width: '15%',
    },
    {
      key: 'cityName',
      header: 'City',
      sortable: true,
      width: '20%',
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      width: '10%',
    },
  ];

  ngOnInit(): void {
    this.pageLoadingService.stop();
    this.loadActionAccess();
    this.loadLookups();
    this.loadFundingRecipientLookups();
    this.refreshFundingRecipients();
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

          console.log('[Authorization] FR action access:', response.data);
        },
        error: (error) => {
          console.error('[Authorization] Failed to load FR action access:', error);

          this.actionAccess.set([]);
        },
      });
  }
  private loadLookups(): void {
    forkJoin({}).subscribe({
      next: () => {
        // No additional lookups required for this page.
      },
      error: (error) => {
        console.error('Failed to load lookups', error);
      },
    });
  }

  private loadFundingRecipientLookups(): void {
    this.lookupService
      .getFundingRecipients()
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.error('[Funding Recipient Lookup] Failed to load funding recipients:', error);
          return of<FundingRecipientLookup[]>([]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.fundingRecipientLookups.set(results);
      });
  }

  onFundingRecipientFilterChange(value: string | null): void {
    this.selectedFundingRecipientId.set(value);

    this._currentPage.set(0);
    this.refreshFundingRecipients();
  }

  onStatusFilterChange(value: boolean | null): void {
    this.selectedIsActive.set(value);

    this._currentPage.set(0);
    this.refreshFundingRecipients();
  }
  clearFilters(): void {
    this.selectedFundingRecipientId.set(null);
    // this.selectedCountryId.set('');
    this.selectedIsActive.set(null);

    this._currentPage.set(0);

    this.refreshFundingRecipients();
  }
  onFundingRecipientClear(): void {
    this.selectedFundingRecipientId.set(null);

    this._currentPage.set(0);
    this.refreshFundingRecipients();
  }
  private refreshFundingRecipients(): void {
    this.loading.set(true);
    this.fundingRecipientService
      .getAllFundingRecipients({
        pageNumber: this._currentPage() + 1,
        pageSize: this._pageSize(),
        searchText: null,
        fundingRecipientId: this.selectedFundingRecipientId()
          ? Number(this.selectedFundingRecipientId())
          : null,
        isActive: this.selectedIsActive(),
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

          this._allFundingRecipients.set(pagedData.items);
        },
        error: (err) => console.error(err),
      });
  }
  onEditFundingRecipient(fundingRecipientId: number): void {
    if (!this.canEditFR()) {
      return;
    }

    this.router.navigate(['/admin/funding-recipients', fundingRecipientId]);
  }
  onAddFundingRecipient() {
    this.router.navigate(['/admin/funding-recipients-form']);
  }

  onPageChange(params: PagedRequest): void {
    this._currentPage.set(params.page);
    this._pageSize.set(params.pageSize);

    this.refreshFundingRecipients();
  }

  protected readonly statusColors: Record<string, string> = {
    Active: 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]',
    Paused: 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',
    Completed: 'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-[hsl(var(--aepw-dark-grey))]',
  };
}
