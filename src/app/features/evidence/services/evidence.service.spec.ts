import { TestBed } from '@angular/core/testing';
import { EvidenceService } from './evidence.service';

describe('EvidenceService', () => {
  let svc: EvidenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(EvidenceService);
  });

  it('files() returns initial mock list', () => {
    expect(svc.files().length).toBeGreaterThan(0);
  });

  it('updateStatus() changes a file status', () => {
    const id = svc.files()[0].id;
    svc.updateStatus(id, 'validated');
    expect(svc.files().find(f => f.id === id)?.status).toBe('validated');
  });

  it('getDetailFiles() returns files for a project', () => {
    const projectId = svc.files()[0].projectId;
    const details = svc.getDetailFiles(projectId);
    expect(details.length).toBeGreaterThan(0);
  });
});
