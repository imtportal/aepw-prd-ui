import { AuditEvent, AuditEventType } from './audit.model';

describe('audit.model', () => {
  it('AuditEvent shape with valid type', () => {
    const e: AuditEvent = {
      id: 'a1', type: 'metric_change', title: 'Metric updated',
      description: 'EMP-001 changed from 50 to 55',
      user: 'Alice', userInitials: 'AL', role: 'Project Manager',
      timestamp: '2026-05-01T10:00:00Z', date: '2026-05-01',
    };
    expect(e.type).toBe('metric_change');
  });

  it('AuditEvent supports string oldValue and newValue', () => {
    const e: AuditEvent = {
      id: 'a2', type: 'risk_change', title: 'Risk adjusted',
      description: 'CV1 risk changed from 15% to 20%',
      user: 'James', userInitials: 'JO', role: 'Global Project Lead',
      timestamp: '2026-02-04T16:15:00Z', date: '2026-02-04',
      oldValue: '15%', newValue: '20%',
    };
    expect(e.oldValue).toBe('15%');
    expect(e.newValue).toBe('20%');
  });

  it('AuditEventType covers all source values', () => {
    const types: AuditEventType[] = [
      'metric_change', 'risk_change', 'evidence_added', 'evidence_removed',
      'restatement', 'launch', 'approval', 'rejection', 'status_change',
    ];
    expect(types.length).toBe(9);
  });
});
