import { EvidenceFile, EvidenceStatus, DetailEvidenceFile } from './evidence.model';

describe('evidence.model', () => {
  it('EvidenceFile tracker shape', () => {
    const f: EvidenceFile = {
      id: 'e1', fileName: 'report.pdf', fileType: 'pdf',
      projectId: 'P001', projectName: 'Solar Ghana', period: 'Q1 2026',
      pm: 'Alice', metricCode: 'EMP-001', uploadedAt: '2026-05-01',
      uploadedBy: 'Bob', status: 'pending',
    };
    expect(f.fileType).toBe('pdf');
  });

  it('EvidenceStatus allows needs-review', () => {
    const status: EvidenceStatus = 'needs-review';
    expect(status).toBe('needs-review');
  });

  it('EvidenceStatus allows processing', () => {
    const status: EvidenceStatus = 'processing';
    expect(status).toBe('processing');
  });

  it('DetailEvidenceFile shape', () => {
    const d: DetailEvidenceFile = {
      id: 'd1', fileName: 'photo.jpg', evidenceType: 'Photo',
      uploadedBy: 'Alice', uploadedDate: '2026-05-01', status: 'complete',
    };
    expect(d.status).toBe('complete');
  });
});
