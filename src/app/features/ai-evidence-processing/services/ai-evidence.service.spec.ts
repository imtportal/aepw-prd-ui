import { TestBed } from '@angular/core/testing';
import { AiEvidenceService } from './ai-evidence.service';

describe('AiEvidenceService', () => {
  let service: AiEvidenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AiEvidenceService],
    });
    service = TestBed.inject(AiEvidenceService);
  });

  it('initialises files from repository', () => {
    expect(service.files().length).toBeGreaterThan(0);
  });

  it('updateStatus changes a file status in the signal', () => {
    const id = service.files()[0].id;
    service.updateStatus(id, 'validated');
    expect(service.files().find(f => f.id === id)?.status).toBe('validated');
  });

  it('reprocess sets status to queued', () => {
    const target = service.files().find(f => f.status === 'error');
    expect(target).toBeDefined();
    service.reprocess(target!.id);
    expect(service.files().find(f => f.id === target!.id)?.status).toBe('queued');
  });

  it('loadPaged delegates to repository', done => {
    service.loadPaged({ page: 0, pageSize: 5 }).subscribe(res => {
      expect(res.data.length).toBeLessThanOrEqual(5);
      done();
    });
  });
});
