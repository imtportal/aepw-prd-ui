import { TestBed } from '@angular/core/testing';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let svc: AuditService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(AuditService);
  });

  it('events() returns initial mock list', () => {
    expect(svc.events().length).toBeGreaterThan(0);
  });

  it('getEventsForProject() returns all events', () => {
    const events = svc.getEventsForProject('any-id');
    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBe(svc.events().length);
  });
});
