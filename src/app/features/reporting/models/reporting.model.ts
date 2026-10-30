export interface ReportGenerationRequest {
    reportingYear: string[];
    quaters: string[];
    reviewPeriodCodes:string[];
    topicIds: string[];
    topLevelMetricIds: string[];
    l1metricids: string[];
    projectids: string[];
    cpmIds: string[];
    programLeaderIds: string[];
    fundingrecipientIds: string[];
    programids: string[];
    countrycityids: string[];
    projectstatusids: string[];
    sourcetypeids: string[];
    startdate: string,
    enddate: string,
    recordStatus: string[];
}

export interface ReportRequest {
  reportType: string;
  filters: string[];
}

// filter models
export type FilterType =
  | 'multi-select'
  | 'lookup'
  | 'calendar';


export interface ReportFilter {
  key: string;
  label: string;
  placeholder: string;
  type: FilterType;
  required: boolean;
}


// export interface ReportConfig {
//   code: string;
//   name: string;
//   filters: ReportFilter[];
// }

export interface ReportConfig {
  code: string;
  name: string;
  actionKey: string;
  filters: ReportFilter[];
}

// filter options Model
export interface MetricFilterRequest {
  topicIds?: string[] | null;
  topLevelMetricIds?: string[] | null;
  l1MetricIds?: string[] | null;
}

export interface ReportFilterProjectCascadingRequest {
  projectIds?: string[] | null;
  cpmUserIds?: string[] | null;
  gelUserIds?: string[] | null;
  plUserIds?: string[] | null;
  fundingRecipientIds?: string[] | null;
  programIds?: string[] | null;
  countryCodes?: string[] | null;
  cityIds?: string[] | null;
  reportingYears?: string[] | null;
  quarterCodes?: string[] | null;
  selectedReportType? : string | null
}



export interface ReportIndependentFilterRequest {
  projectStatusIDs?: string[] | null;
  recordStatusIDs?: string[] | null;
  reportingYears?: string[] | null;
  quaters?: string[] | null;
}


export interface MetricFilterOptions {
  topicMetricOptions: MetricOptions[];
  toplevelMetricOptions: MetricOptions[];
  l1MetricOptions: MetricOptions[];
  tables: any;
}

 interface MetricOptions {
  id: string;
  code: string;
  name: string;
  optionName: string;
}

 interface ReportFilterOption {
  id: string;
  code: string;
  name: string;
}

 interface ReportFilterProjectOption {
  projectId: string;
  pin: string;
  projectName: string;
}

export interface ReportFilterProjectCascadingOptions {

  projectOptions: ReportFilterProjectOption[];
  cpmOptions: ReportFilterOption[];
  gelOptions: ReportFilterOption[];
  plOptions: ReportFilterOption[];
  fundingRecipientOptions: ReportFilterOption[];
  programOptions: ReportFilterOption[];
  countryCityOptions: ReportFilterOption[];
  // cityOptions: ReportFilterOption[];
}

export interface ReportFilterIndependentOptions {
  projectStatusOptions: ReportFilterOption[];
  sourceTypeOptions: ReportFilterOption[];
   reportingYearOptions: ReportFilterOption[];
  reportingQuarterOptions: ReportFilterOption[];
  recordStatusOptions: ReportFilterOption[];
  projectCategoryOptions:ReportFilterOption[];
}


