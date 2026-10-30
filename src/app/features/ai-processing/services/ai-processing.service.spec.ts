import { TestBed } from '@angular/core/testing';
import { AIProcessingService } from './ai-processing.service';

describe('AIProcessingService', () => {
  let svc: AIProcessingService;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(AIProcessingService);
  });

  it('loading signal is false by default', () => {
    expect(svc.loading()).toBe(false);
  });

  it('error signal is null by default', () => {
    expect(svc.error()).toBeNull();
  });

  it('queue() returns initial mock list', () => {
    expect(svc.queue().length).toBeGreaterThan(0);
  });

  it('reprocess() sets item status back to queued', () => {
    const item = svc.queue().find(i => i.status !== 'queued')!;
    svc.reprocess(item.id);
    expect(svc.queue().find(i => i.id === item.id)!.status).toBe('queued');
  });

  it('extracted field is typed — challanNo is accessible', () => {
    const item = svc.queue().find(i => i.extracted?.challanNo !== undefined)!;
    expect(typeof item.extracted!.challanNo).toBe('string');
  });
});
