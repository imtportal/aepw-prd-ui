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

export type ReportingProjectStatus = 'Closed' | 'Implementation' | 'Active';

export interface ReportingProject {
  pin:     string;
  title:   string;
  program: string;
  pm:      string;
  status:  ReportingProjectStatus;
  metrics: TopLevelMetric[];
}

export interface ReportingDashboardDto {
  programs:    Program[];
  projects:    ReportingProject[];
  aepwMetrics: TopLevelMetric[];
  yoyData:     YoyDataPoint[];
  pieData:     PieDataPoint[];
}

export type DrillLevel = 'aepw' | 'program' | 'project';
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
