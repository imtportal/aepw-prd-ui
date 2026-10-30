export interface DashboardPortfolioList {
  metrics: DashboardMetric[];
  programs: DashboardProgram[];
  totalRecord: number;
}

export interface DashboardMetric {
  metricId?: string;
  metricCode?: string;
  metricName?: string;
  categoryCode?: string;
  color?: string;
}

export interface DashboardProgram {
  programId?: string;
  programCode?: string;
  programName?: string;
  projectCount?: string;
  metrics: DashboardProgramMetric[];
  impacts: DashboardProgramImpact[];
}

export interface DashboardProgramMetric {
  metricId?: string;
  metricCode?: string;
  riskAdjustment?: string;
}

export interface DashboardProgramImpact {
  impactMasterId?: string;
  pin?: string;
  impactName?: string;
  categoryId?: string;
  categoryCode?: string;
  categoryName?: string;
  color?: string;
  statusId?: string;
  statusCode?: string;
  statusName?: string;
  recordTypeId?: string;
  recordTypeName?: string;
  metrics: DashboardImpactMetric[];
 fundingRecipients:string;
}

export interface DashboardImpactMetric {
  metricId?: string;
  metricCode?: string;
  riskAdjustment?: string;
}

export interface DashboardPortfolioAdjustmentByCategories {
  code: string;
  name?: string;
  metricId?: string;
  riskAdjustment?: string;
  quarterlyGrowth?: string;
  annualGrowth?: string;
  color?: string;
}



export interface DashboardPortfolioByCategoriesRequest {
  categoryCode: string;
  reviewPeriodCodes: string[];
  sinceInception: boolean;
}

export interface DashboardPortfolioListRequest {
  reviewPeriodCodes: string[];
  categoryCode?: string | null;

  programId: string | null;
  statusId?: string | null;
  recordTypeId?: string | null;
  searchTerm?: string | null;

  pageNumber: number;
  pageSize: number;

  sinceInception: boolean;
}


export interface DashboardTableProgramRow {
  programId?: string;
  programCode?: string;
  programName?: string;
  projectCount?: number;

  metricValues?: Record<string, string>;

  projects?: DashboardTableProjectRow[];
}

export interface DashboardTableProjectRow {

  impactMasterId: string;

  pin: string;

  impactName: string;

  fundingRecipientName?: string;

  categoryCode: string;

  categoryName: string;

  color: string;

  statusCode: string;

  statusName: string;

  recordTypeName: string;

  metricValues: Record<string, string>;
  
  fundingRecipients:string;

}

