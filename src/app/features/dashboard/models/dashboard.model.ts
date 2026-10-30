export interface L1Metric {
  code:         string;
  name:         string;
  reported:     number;
  riskAdjusted: number;
  unit:         string;
  isCorporate?: boolean;
}

export interface TopLevelMetric {
  code:             string;
  name:             string;
  reported:         number;
  riskAdjusted:     number;
  unit:             string;
  yoyChange:        number;
  qoqChange?:       number;
  contributionPct?: number;
  l1Metrics:        L1Metric[];
}

export interface Program {
  id:           string;
  name:         string;
  region:       string;
  projectCount: number;
  lat:          number;
  lng:          number;
  metrics:      TopLevelMetric[];
}

export type ReportingProjectStatus =
  | 'Active with Reporting'
  | 'Active with No Reporting'
  | 'Closed with no further reporting'
  | 'Closed with further reporting';

export type ReportingProjectType = 'Project' | 'Corporate';

export interface ReportingProject {
  pin:              string;
  imId:             string;
  /** Project Library projectId (e.g. '2023-0042') — link target for /reviews/:projectId. Absent when no Project Library entry exists for this project. */
  projectId?:       string;
  title:            string;
  program:          string;
  pm:               string;
  fundingRecipient: string;
  type:             ReportingProjectType;
  status:           ReportingProjectStatus;
  metrics:          TopLevelMetric[];
}

export type TimePeriod = 'q1' | 'q2' | 'q3' | 'q4' | 'annual' | 'ytd' | 'since-start';

export interface YoyDataPoint {
  year: string;
  MW:   number;
  CV:   number;
  EE:   number;
  SB:   number;
  MC:   number;
}

export interface PieDataPoint {
  name:  string;
  value: number;
  color: string;
}
