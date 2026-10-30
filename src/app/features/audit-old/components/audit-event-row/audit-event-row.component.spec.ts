import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditEventRowComponent } from './audit-event-row.component';
import { AuditEvent } from '../../models/audit.model';

const EVENT_WITH_ALL: AuditEvent = {
  id: 'a3', type: 'risk_change', title: 'Risk Adjustment Modified',
  description: 'Risk for CV1 changed.',
  user: 'James Okoro', userInitials: 'JO', role: 'Global Project Lead',
  timestamp: '04:15 PM', date: 'Feb 4, 2026',
  metricId: 'CV1', category: 'CV',
  oldValue: '15%', newValue: '20%',
};

const EVENT_MINIMAL: AuditEvent = {
  id: 'a8', type: 'launch', title: 'Review Launched',
  description: 'Q4 2025 review launched.',
  user: 'Alex Johnson', userInitials: 'AJ', role: 'Project Manager',
  timestamp: '10:00 AM', date: 'Jan 15, 2026',
};

describe('AuditEventRowComponent', () => {
  let fixture: ComponentFixture<AuditEventRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditEventRowComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AuditEventRowComponent);
    fixture.componentRef.setInput('event', EVENT_WITH_ALL);
    fixture.detectChanges();
  });

  it('data-event-title text matches event.title', () => {
    const el = fixture.nativeElement.querySelector('[data-event-title]');
    expect(el?.textContent?.trim()).toBe('Risk Adjustment Modified');
  });

  it('data-category-badge present when category and metricId are set', () => {
    expect(fixture.nativeElement.querySelector('[data-category-badge]')).toBeTruthy();
  });

  it('data-category-badge absent when category is undefined', () => {
    fixture.componentRef.setInput('event', EVENT_MINIMAL);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-category-badge]')).toBeFalsy();
  });

  it('data-value-change present when both oldValue and newValue are set', () => {
    expect(fixture.nativeElement.querySelector('[data-value-change]')).toBeTruthy();
  });

  it('data-value-change absent when oldValue is undefined', () => {
    fixture.componentRef.setInput('event', EVENT_MINIMAL);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-value-change]')).toBeFalsy();
  });

  it('data-user-initials text matches event.userInitials', () => {
    const el = fixture.nativeElement.querySelector('[data-user-initials]');
    expect(el?.textContent?.trim()).toBe('JO');
  });
});
