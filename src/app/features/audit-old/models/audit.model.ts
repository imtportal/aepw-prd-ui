export type AuditEventType =
  | 'metric_change'
  | 'risk_change'
  | 'evidence_added'
  | 'evidence_removed'
  | 'restatement'
  | 'launch'
  | 'approval'
  | 'rejection'
  | 'status_change';

export interface AuditEvent {
  id:           string;
  type:         AuditEventType;
  title:        string;
  description:  string;
  user:         string;
  userInitials: string;
  role:         string;
  timestamp:    string;
  date:         string;
  metricId?:    string;
  category?:    string;
  oldValue?:    string;
  newValue?:    string;
}
