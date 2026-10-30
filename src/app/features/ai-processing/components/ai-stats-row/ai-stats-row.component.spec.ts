import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AiStatsRowComponent } from './ai-stats-row.component';

describe('AiStatsRowComponent', () => {
  let fixture: ComponentFixture<AiStatsRowComponent>;

  function create(overrides: Partial<{total:number;queued:number;processing:number;completed:number;needsReview:number;errorCount:number}> = {}) {
    const defaults = { total: 8, queued: 2, processing: 1, completed: 3, needsReview: 1, errorCount: 1 };
    const vals = { ...defaults, ...overrides };
    fixture = TestBed.createComponent(AiStatsRowComponent);
    fixture.componentRef.setInput('total',       vals.total);
    fixture.componentRef.setInput('queued',      vals.queued);
    fixture.componentRef.setInput('processing',  vals.processing);
    fixture.componentRef.setInput('completed',   vals.completed);
    fixture.componentRef.setInput('needsReview', vals.needsReview);
    fixture.componentRef.setInput('errorCount',  vals.errorCount);
    fixture.detectChanges();
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [AiStatsRowComponent] }));

  it('renders total count', () => {
    create({ total: 42 });
    const el = fixture.debugElement.query(By.css('[data-stat-total]'));
    expect(el.nativeElement.textContent.trim()).toBe('42');
  });

  it('renders processing count', () => {
    create({ processing: 5 });
    expect(fixture.debugElement.query(By.css('[data-stat-processing]')).nativeElement.textContent.trim()).toBe('5');
  });

  it('renders queued count', () => {
    create({ queued: 3 });
    expect(fixture.debugElement.query(By.css('[data-stat-queued]')).nativeElement.textContent.trim()).toBe('3');
  });

  it('renders completed count', () => {
    create({ completed: 7 });
    expect(fixture.debugElement.query(By.css('[data-stat-completed]')).nativeElement.textContent.trim()).toBe('7');
  });

  it('renders needsReview count', () => {
    create({ needsReview: 2 });
    expect(fixture.debugElement.query(By.css('[data-stat-needs-review]')).nativeElement.textContent.trim()).toBe('2');
  });

  it('renders errorCount', () => {
    create({ errorCount: 4 });
    expect(fixture.debugElement.query(By.css('[data-stat-error]')).nativeElement.textContent.trim()).toBe('4');
  });
});
