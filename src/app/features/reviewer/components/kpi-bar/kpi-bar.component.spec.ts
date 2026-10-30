import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiBarComponent } from './kpi-bar.component';

describe('KpiBarComponent', () => {
  let fixture:   ComponentFixture<KpiBarComponent>;
  let component: KpiBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiBarComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(KpiBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('pendingMetricsCount', 5);
    fixture.componentRef.setInput('materialFlagsCount',  2);
    fixture.componentRef.setInput('rejectionsCount',     3);
    fixture.detectChanges();
  });

  it('renders pendingMetricsCount in [data-kpi-pending]', () => {
    const el = fixture.nativeElement.querySelector('[data-kpi-pending]');
    expect(el.textContent).toContain('5');
  });

  it('renders materialFlagsCount in [data-kpi-flags]', () => {
    const el = fixture.nativeElement.querySelector('[data-kpi-flags]');
    expect(el.textContent).toContain('2');
  });

  it('renders rejectionsCount in [data-kpi-rejections]', () => {
    const el = fixture.nativeElement.querySelector('[data-kpi-rejections]');
    expect(el.textContent).toContain('3');
  });

  it('re-renders when input changes', () => {
    fixture.componentRef.setInput('pendingMetricsCount', 99);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-kpi-pending]');
    expect(el.textContent).toContain('99');
  });
});
