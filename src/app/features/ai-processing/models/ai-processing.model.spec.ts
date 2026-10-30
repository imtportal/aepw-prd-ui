import { QueueItem, ProcessingStatus } from './ai-processing.model';

describe('ai-processing.model', () => {
  it('QueueItem shape', () => {
    const q: QueueItem = {
      id: 'q1', fileName: 'data.xlsx', fileType: 'excel',
      projectId: 'P001', projectName: 'Solar Ghana', period: 'Q1 2026',
      metricCode: 'EMP-001', metricName: 'Employment Created',
      uploadedAt: '2026-05-01', status: 'queued',
    };
    expect(q.status).toBe('queued');
  });

  it('ProcessingStatus allows completed', () => {
    const status: ProcessingStatus = 'completed';
    expect(status).toBe('completed');
  });

  it('ProcessingStatus allows needs-review', () => {
    const status: ProcessingStatus = 'needs-review';
    expect(status).toBe('needs-review');
  });

  it('QueueItem extracted is a structured object', () => {
    const q: QueueItem = {
      id: 'q2', fileName: 'challan.jpg', fileType: 'image',
      projectId: 'P002', projectName: 'Ocean Cleanup', period: 'Q3 2025',
      metricCode: 'MW1.11', metricName: 'Plastic waste diverted',
      uploadedAt: '2025-09-22', status: 'completed',
      extracted: { challanNo: '7025', quantity: 767 },
      processingTime: '12s',
    };
    expect(q.extracted?.['challanNo']).toBe('7025');
  });
});
