import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuditPageComponent } from './audit-page.component';
import { AuditService } from '../services/audit.service';
import { AuditEvent } from '../models/audit.model';

const MOCK_EVENTS: AuditEvent[] = [
  {
    id: 'a1', type: 'approval', title: 'Metric Approved',
    description: 'MW2 approved.', user: 'Sarah Chen', userInitials: 'SC', role: 'PM',
    timestamp: '10:45 AM', date: 'Feb 5, 2026', metricId: 'MW2', category: 'MW',
  },
  {
    id: 'a2', type: 'evidence_added', title: 'Evidence Uploaded',
    description: 'Weighbridge logs added.', user: 'Alex Johnson', userInitials: 'AJ', role: 'PM',
    timestamp: '09:30 AM', date: 'Feb 5, 2026',
  },
  {
    id: 'a3', type: 'risk_change', title: 'Risk Changed',
    description: 'Risk for CV1 changed.', user: 'James Okoro', userInitials: 'JO', role: 'Lead',
    timestamp: '04:15 PM', date: 'Feb 4, 2026', metricId: 'CV1', category: 'CV',
    oldValue: '15%', newValue: '20%',
  },
];

describe('AuditPageComponent', () => {
  let fixture:   ComponentFixture<AuditPageComponent>;
  let component: AuditPageComponent;

  const fakeAuditSvc = {
    events:  signal(MOCK_EVENTS),
    loading: signal(false),
    error:   signal<string | null>(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:   [AuditPageComponent],
      providers: [{ provide: AuditService, useValue: fakeAuditSvc }],
    }).compileComponents();
    fixture   = TestBed.createComponent(AuditPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('eventCount() equals 3 when filter is "all"', () => {
    expect(component.eventCount()).toBe(3);
  });

  it('setting typeFilter to "approval" reduces filteredEvents to approval-only', () => {
    component.typeFilter.set('approval');
    expect(component.filteredEvents().every(e => e.type === 'approval')).toBe(true);
  });

  it('eventCount() updates to reflect filtered count', () => {
    component.typeFilter.set('approval');
    expect(component.eventCount()).toBe(1);
  });

  it('groupedByDate() has 2 unique date keys (Feb 5 and Feb 4)', () => {
    expect(component.groupedByDate().size).toBe(2);
  });

  it('renders 2 data-date-separator elements', () => {
    const seps = fixture.nativeElement.querySelectorAll('[data-date-separator]');
    expect(seps.length).toBe(2);
  });

  it('renders 3 app-audit-event-row elements', () => {
    const rows = fixture.nativeElement.querySelectorAll('app-audit-event-row');
    expect(rows.length).toBe(3);
  });

  it('dateCompare returns negative when a.key is earlier than b.key (newest first)', () => {
    const a = { key: 'Feb 4, 2026', value: [] as AuditEvent[] };
    const b = { key: 'Feb 5, 2026', value: [] as AuditEvent[] };
    expect(component.dateCompare(a, b)).toBeGreaterThan(0);
  });
});
