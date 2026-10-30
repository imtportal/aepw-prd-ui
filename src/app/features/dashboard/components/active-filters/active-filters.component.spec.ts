import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveFiltersComponent } from './active-filters.component';
import { ActiveFilter, ActiveFilterKey } from '../../dashboard.types';

describe('ActiveFiltersComponent', () => {
  let fixture: ComponentFixture<ActiveFiltersComponent>;
  let component: ActiveFiltersComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveFiltersComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ActiveFiltersComponent);
    component = fixture.componentInstance;
  });

  it('renders nothing when filters is empty', () => {
    fixture.componentRef.setInput('filters', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.children.length).toBe(0);
  });

  it('renders one chip per active filter', () => {
    const filters: ActiveFilter[] = [
      { label: 'PM: Sarah Chen', key: 'filterPM' },
      { label: 'Stage: Approval', key: 'filterStage' },
    ];
    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-chip]').length).toBe(2);
  });

  it('renders filter label text', () => {
    fixture.componentRef.setInput('filters', [{ label: 'PM: Sarah Chen', key: 'filterPM' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('PM: Sarah Chen');
  });

  it('emits clear with correct key when X button clicked', () => {
    fixture.componentRef.setInput('filters', [{ label: 'PM: Sarah Chen', key: 'filterPM' }]);
    fixture.detectChanges();
    let emittedKey: ActiveFilterKey | undefined;
    component.clear.subscribe((k: ActiveFilterKey) => (emittedKey = k));
    fixture.nativeElement.querySelector('[data-clear-btn]').click();
    expect(emittedKey).toBe('filterPM');
  });

  it('emits clearAll when Clear all button clicked', () => {
    fixture.componentRef.setInput('filters', [{ label: 'PM: Sarah Chen', key: 'filterPM' }]);
    fixture.detectChanges();
    let emitted = false;
    component.clearAll.subscribe(() => (emitted = true));
    fixture.nativeElement.querySelector('[data-clear-all]').click();
    expect(emitted).toBe(true);
  });
});
