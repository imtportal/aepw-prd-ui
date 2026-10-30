export enum AuditModuleType {
  UserManagement = 1,
  MetricMaster = 2,
  ImpactMaster = 3,
  ReviewLifecycle = 4,
  ReviewApproval = 5,
  Restatement = 6
}

export interface AuditTimelineItem {
  moduleName: string;
  entityName: string;
  recordTitle?: string;
  changedOn: string;
  changedBy: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  eventAction?: string;
  /** Companion comment (e.g. Approval or Rejection comment) associated with a Status change event. */
  comment?: string;
}

export interface AuditTimelineRequest {
  module: AuditModuleType;
  fromDate?: string;
  toDate?: string;
  projectId?: string | number;
  programId?: string | number | null;
  searchText?: string;
  metricCode?: string;
  eventAction?: string;
  pageNumber?: number;
  pageSize?: number;
}

export type DatePreset = '30d' | 'today' | '7d' | 'custom';
