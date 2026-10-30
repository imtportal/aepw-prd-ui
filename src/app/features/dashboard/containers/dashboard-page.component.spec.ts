import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { DashboardPageComponent } from './dashboard-page.component';
import { ReviewService } from '../../reviews/services/review.service';

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        ReviewService,
        provideRouter([]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    router   = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('shows review count in header', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(`Showing ${component.filteredReviews().length} of`);
  });

  it('filteredReviews reacts to filterPM signal change', () => {
    const all = component.filteredReviews().length;
    component.filterPM.set('Sarah Chen');
    fixture.detectChanges();
    expect(component.filteredReviews().length).toBeLessThan(all);
    expect(component.filteredReviews().every(r => r.pm === 'Sarah Chen')).toBe(true);
  });

  it('filteredReviews reacts to filterStage signal change', () => {
    component.filterStage.set('Due');
    fixture.detectChanges();
    expect(component.filteredReviews().every(r => r.stage === 'Due')).toBe(true);
  });

  it('activeFilters updates immediately on searchId change', () => {
    component.searchId.set('Hydra');
    fixture.detectChanges();
    expect(component.activeFilters().some(f => f.key === 'searchId')).toBe(true);
  });

  it('row click navigates to /reviews/:id', async () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const id  = component.filteredReviews()[0].projectId;
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
    row.click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/reviews', id]);
  });

  it('displays loading state when loading signal is true', () => {
    const svc = TestBed.inject(ReviewService);
    svc.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-loading]')).not.toBeNull();
  });

  it('displays error message when error signal is non-null', () => {
    const svc = TestBed.inject(ReviewService);
    svc.error.set('Something went wrong');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Something went wrong');
  });
});

// Separate describe so fake timers are installed before the component subscribes
describe('DashboardPageComponent — debounce', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;

  beforeEach(async () => {
    // Install fake timers BEFORE creating the component so RxJS debounceTime
    // picks up the fake setTimeout from the start.
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [ReviewService, provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('filteredReviews updates after debouncedSearch settles', async () => {
    const total = component.filteredReviews().length;
    component.searchId.set('2023-0042');
    fixture.detectChanges();
    // Before debounce settles the filtered list is unchanged
    expect(component.filteredReviews().length).toBe(total);
    // Advance past debounce threshold; advanceTimersByTimeAsync also drains
    // any microtasks queued by the timer callbacks (toSignal effect scheduling)
    await vi.advanceTimersByTimeAsync(300);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(component.filteredReviews().length).toBe(1);
  });
});
