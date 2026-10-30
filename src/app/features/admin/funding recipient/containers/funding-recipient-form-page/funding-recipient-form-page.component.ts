import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FundingRecipientService } from '../../services/funding-recipient.service';
import { LookupService } from '../../../../../core/services/lookup-service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CityLookup, CountryLookup, StatusLookup } from '../../../../../core/models/lookup-model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { finalize, forkJoin } from 'rxjs';
import {
  CreateFundingRecipientRequest,
  FundingRecipient,
  FundingRecipientDetailModel,
  UpdateFundingRecipientRequest,
} from '../../models/funding-recipient.model';
import { AuthorizationService, AuthStateService } from '../../../../../core/auth';
import { HasUnsavedChanges } from '../../../../../core/guards/unsaved-changes.guard';
import { ActionAccess } from '../../../../../core/auth/models/authorization.model';

// Local, numeric-id view of CityLookup so cityId conversions happen once at the boundary.
interface CityOption {
  cityId: number;
  cityName: string;
}

@Component({
  selector: 'funding-recipient-form-page',
  standalone: true,
  imports: [FormsModule, NgSelectModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: 'funding-recipient-form-page.component.html',
})
export class FundingRecipientFormPage implements OnInit, HasUnsavedChanges {
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
  protected readonly canSaveFR = computed(() =>
    this.isEditMode() ? this.canEditFR() : this.canAddFR(),
  );
  protected readonly canDeleteFR = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'DELETE' && action.value);

    console.log('DELETE button access:', result);

    return result;
  });
  ////////////////////////////////////////////////// ;
  private readonly router = inject(Router);
  private readonly lookupService = inject(LookupService);
  private readonly fundingRecipientService = inject(FundingRecipientService);
  readonly saving = signal(false);
  readonly isEditMode = signal(false);
  readonly fundingRecipientId = signal<number | null>(null);
  readonly cities = signal<CityLookup[]>([]);
  @ViewChild('cityDropdownContainer')
  cityDropdownContainer!: ElementRef<HTMLDivElement>;
  private readonly destroyRef = inject(DestroyRef);
  // Country/city signals
  // Country / City signals
  readonly countries = signal<CountryLookup[]>([]);
  readonly selectedCountryName = signal<string | null>(null);

  readonly selectedCityIds = signal<number[]>([]);
  readonly citySearch = signal('');
  readonly dropdownOpen = signal(false);
  hasUnsavedChanges(): boolean {
    if (this.saving()) {
      return false;
    }

    return this.fundingRecipientForm.dirty;
  }
  // Cities are normalized to a numeric cityId here so the rest of the component/template
  // never has to re-cast the string cityId coming from the shared CityLookup model.
  readonly availableCities = computed<CityOption[]>(() => {
    const countryName = this.selectedCountryName();

    if (!countryName) {
      return [];
    }

    const cities =
      this.countries().find((country) => country.countryName === countryName)?.cities ?? [];

    return cities.map((city) => ({ cityId: Number(city.cityId), cityName: city.cityName }));
  });

  readonly selectedCities = computed(() => {
    const selectedIds = this.selectedCityIds();

    return this.availableCities().filter((city) => selectedIds.includes(city.cityId));
  });
  ////////////////////////////////////////////
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  readonly statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.dropdownOpen()) {
      return;
    }

    const target = event.target as Node;

    if (this.cityDropdownContainer && !this.cityDropdownContainer.nativeElement.contains(target)) {
      this.dropdownOpen.set(false);
    }
  }

  toggleCity(city: CityOption): void {
    const cityId = city.cityId;
    const currentIds = this.selectedCityIds();

    const newIds = currentIds.includes(cityId)
      ? currentIds.filter((id) => id !== cityId)
      : [...currentIds, cityId];

    this.selectedCityIds.set(newIds);

    this.fundingRecipientForm.controls.cityIds.setValue(newIds);
    this.fundingRecipientForm.controls.cityIds.markAsTouched();
    this.fundingRecipientForm.controls.cityIds.updateValueAndValidity();
  }
  removeCity(cityId: number): void {
    const newIds = this.selectedCityIds().filter((selectedId) => selectedId !== cityId);

    this.selectedCityIds.set(newIds);

    this.fundingRecipientForm.controls.cityIds.setValue(newIds);
    this.fundingRecipientForm.controls.cityIds.markAsTouched();
    this.fundingRecipientForm.controls.cityIds.updateValueAndValidity();
  }
  toggleDropdown(event: Event): void {
    event.stopPropagation();

    if (!this.selectedCountryName()) {
      return;
    }

    this.dropdownOpen.update((value) => !value);
  }
  // FUNDING RECIPIENT FORM
  readonly fundingRecipientForm = this.fb.group({
    name: this.fb.control(''),
    orgName: this.fb.control('', Validators.required),

    contactName: this.fb.control('', Validators.required),
    email: this.fb.control('', [Validators.required, Validators.email]),
    phone: this.fb.control(''),

    address: this.fb.control('', Validators.required),
    zipCode: this.fb.control('', Validators.required),

    countryName: this.fb.control<string | null>(null, Validators.required),
    cityIds: this.fb.control<number[]>([], Validators.required),
    isActive: this.fb.control<boolean | null>(null, Validators.required),
  });

  // NGONINT
  ngOnInit(): void {
    this.loadActionAccess();
    this.loadLookups();
    this.setupCountryChangeListener();
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
  private setupCountryChangeListener(): void {
    this.fundingRecipientForm.controls.countryName.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((countryName) => {
        this.selectedCountryName.set(countryName);

        // Cities from the previous country are no longer valid.
        this.selectedCityIds.set([]);
        this.citySearch.set('');
        this.dropdownOpen.set(false);

        this.fundingRecipientForm.controls.cityIds.setValue([]);
      });
  }
  private loadLookups(): void {
    this.lookupService
      .getCities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.countries.set(response.data ?? []);

          const id = this.route.snapshot.paramMap.get('fundingRecipientId');

          if (id) {
            this.loadFundingRecipient(Number(id));
          }
        },
        error: () => {
          this.toast.error('Failed to load countries and cities.');
        },
      });
  }

  private createFundingRecipient(): void {
    if (this.saving()) {
      return;
    }

    const form = this.fundingRecipientForm.getRawValue();

    const request: CreateFundingRecipientRequest = {
      name: form.orgName ?? '',
      orgName: form.orgName ?? '',
      contactName: form.contactName ?? '',
      email: form.email ?? '',
      phone: form.phone ?? '',
      address: form.address ?? '',
      zipCode: form.zipCode ?? '',
      cityIds: form.cityIds ?? [],
      isActive: form.isActive ?? true,
      createdBy: this.authStateService.getCurrentUserId()!,
    };

    this.saving.set(true);

    this.fundingRecipientService
      .createFundingRecipient(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.fundingRecipientForm.markAsPristine();
          this.toast.success('Funding Recipient created successfully');
          this.router.navigate(['/admin/funding-recipients']);
        },
        error: (error) => {
          console.error(error);
          this.toast.error(error?.error?.message ?? 'Failed to create Funding Recipient.');
        },
      });
  }
  private updateFundingRecipient(): void {
    const form = this.fundingRecipientForm.getRawValue();

    const request: UpdateFundingRecipientRequest = {
      fundingRecipientId: this.fundingRecipientId()!,
      name: form.orgName ?? '',
      orgName: form.orgName ?? '',
      contactName: form.contactName ?? '',
      email: form.email ?? '',
      phone: form.phone ?? '',
      address: form.address ?? '',
      zipCode: form.zipCode ?? '',
      cityIds: form.cityIds ?? [],
      isActive: form.isActive ?? true,
      updatedBy: this.authStateService.getCurrentUserId()!,
    };

    this.saving.set(true);

    this.fundingRecipientService
      .updateFundingRecipient(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.fundingRecipientForm.markAsPristine();
          this.toast.success('Funding Recipient updated successfully');
          this.router.navigate(['/admin/funding-recipients']);
        },
        error: (error) => {
          console.error(error);
          this.toast.error(error?.error?.message ?? 'Failed to update Funding Recipient.');
        },
      });
  }
  private loadFundingRecipient(fundingRecipientId: number): void {
    this.isEditMode.set(true);
    console.log(this.isEditMode());
    this.fundingRecipientId.set(fundingRecipientId);
    forkJoin({
      detail: this.fundingRecipientService.getFundingRecipientById(fundingRecipientId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ detail }) => {
          this.patchFundingRecipientForm(detail.data);
        },
        error: (err) => {
          console.error(err);
          this.toast.error('Failed to load funding recipient.');
        },
      });
  }
  private patchFundingRecipientForm(recipient: FundingRecipientDetailModel): void {
    const cities = recipient.cities ?? [];

    const cityIds = cities.map((city) => Number(city.cityId));
    const countryName = cities[0]?.countryName ?? null;

    this.selectedCountryName.set(countryName);
    this.selectedCityIds.set(cityIds);

    // emitEvent: false keeps the country valueChanges listener (which resets city
    // selection on user-driven country changes) from wiping out this patched data.
    this.fundingRecipientForm.patchValue(
      {
        name: recipient.name,
        orgName: recipient.orgName,

        contactName: recipient.contactName,
        email: recipient.email,
        phone: recipient.phone,

        address: recipient.address,
        zipCode: recipient.zipCode,

        countryName,
        cityIds,

        isActive: recipient.isActive,
      },
      { emitEvent: false },
    );

    this.citySearch.set('');
    this.dropdownOpen.set(false);
    this.fundingRecipientForm.markAsPristine();
  }
  onSave(): void {
    console.log('ON SAVE CALLED', new Date().toISOString());
    if (this.fundingRecipientForm.invalid) {
      this.fundingRecipientForm.markAllAsTouched();

      return;
    }

    if (this.saving()) {
      console.log('SAVE BLOCKED - ALREADY SAVING');
      return;
    }
    if (this.isEditMode()) {
      this.updateFundingRecipient();
    } else {
      this.createFundingRecipient();
    }
  }

  onBack(): void {
    this.router.navigate(['/admin/funding-recipients']);
  }
}
