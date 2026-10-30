import { ReportConfig , ReportFilter } from "../models/reporting.model";

/*
|--------------------------------------------------------------------------
| Common Filters
|--------------------------------------------------------------------------
|
| We define filters once and reuse them across reports.
|
*/
const reportingYear: ReportFilter = {
  key: 'reportingYears',
  label: 'Reporting Year',
  placeholder: 'Select year(s)',
  type: 'multi-select',
  required: true
};

const quarter: ReportFilter = {
  key: 'quaters',
  label: 'Quarter',
  placeholder: 'Select quarter(s)',
  type: 'multi-select',
  required: true
};

const topic: ReportFilter = {
  key: 'topicIds',
  label: 'Topic',
  placeholder: 'Select topic(s)',
  type: 'multi-select',
  required: false
};

const topLevelMetric: ReportFilter = {
  key: 'topLevelMetricIds',
  label: 'Top-Level Metric',
  placeholder: 'Select metric(s)',
  type: 'multi-select',
  required: true
};

const l1Metric: ReportFilter = {
  key: 'l1metricids',
  label: 'L1 Metric',
  placeholder: 'Select L1 metric(s)',
  type: 'multi-select',
  required: false
};

const projectPin: ReportFilter = {
  key: 'projectids',
  label: 'PIN',
  placeholder: 'Search PIN',
  type: 'multi-select',
  required: true
};

const projectName: ReportFilter = {
  key: 'projectNameIds',
  label: 'IM Name',
  placeholder: 'Search project name',
  type: 'multi-select',
  required: true
};

const cpm: ReportFilter = {
  key: 'cpmIds',
  label: 'Contract Performance Manager',
  placeholder: 'Select CPM(s)',
  type: 'multi-select',
  required: true
};

const programLeader: ReportFilter = {
  key: 'programLeaderIds',
  label: 'Program Leader',
  placeholder: 'Select program leader(s)',
  type: 'multi-select',
  required: true
};

const globalExecutionLeader: ReportFilter = {
  key: 'globalExecutionLeaderIds',
  label: 'Global Execution Leader',
  placeholder: 'Select Global Execution Leader(s)',
  type: 'multi-select',
  required: true
};

const fundingRecipient: ReportFilter = {
  key: 'fundingrecipientIds',
  label: 'Funding Recipient',
  placeholder: 'Search funding recipient',
  type: 'multi-select',
  required: true
};

const program: ReportFilter = {
  key: 'programids',
  label: 'Program',
  placeholder: 'Select program(s)',
  type: 'multi-select',
  required: true
};

const countryCity: ReportFilter = {
  key: 'countrycityids',
  label: 'Country / City',
  placeholder: 'Search country or city',
  type: 'multi-select',
  required: true
};

const projectStatus: ReportFilter = {
  key: 'projectstatusids',
  label: 'Project Status',
  placeholder: 'Select status(es)',
  type: 'multi-select',
  required: true
};

const projectCategory: ReportFilter = {
  key: 'projectcategoryids',
  label: 'Project Category',
  placeholder: 'Select Category',
  type: 'multi-select',
  required: true
};

const sourceType: ReportFilter = {
  key: 'sourcetypeids',
  label: 'Source Type (Project / Corporate)',
  placeholder: 'Select source type(s)',
  type: 'multi-select',
  required: false
};

const customerDateRange: ReportFilter = {
  key: 'customerDateRange',
  label: 'Customer Date Range',
  placeholder: 'Select date range',
  type: 'calendar',
  required: false
};

// const startDate: ReportFilter = {
//   key: 'startDate',
//   label: 'Start Date',
//   placeholder: 'Select date range',
//   type: 'calendar',
//   required: false
// };

// const endDate: ReportFilter = {
//   key: 'endDate',
//   label: 'End Date',
//   placeholder: 'Select date range',
//   type: 'calendar',
//   required: false
// };

const recordStatus: ReportFilter = {
  key: 'RecordStatusIds',
  label: 'Record Status',
  placeholder: 'Select status',
  type: 'multi-select',
  required: false
};


export const SUMMARY_SINCE_INCEPTION: ReportConfig = {

  code: 'SummarySinceInception',

  name: 'Summary (Since Inception)',

  actionKey: 'SummarySinceInception',  // Key name present in DB PageActionStructure for reporting (infutre Key change check from DB)

  filters: [

    // L1 will added

    // { ...l1Metric, required: false },

    {
      ...projectPin,
      required: false
    },

    {
      ...projectName,
      required: false
    },

    {
      ...cpm,
      required: false
    },

    {
      ...programLeader,
      required: false
    },

    {
      ...globalExecutionLeader,
      required: false
    },

    // {
    //   ...fundingRecipient,
    //   required: true
    // },

    {
      ...program,
      required: false
    },

    // {
    //   ...countryCity,
    //   required: true
    // },

    {
      ...projectStatus,
      required: false
    },

     { ...projectCategory, required: false },


    {
      ...sourceType,
      required: false
    },

    { ...recordStatus, required:  false }

  ]

};

export const REVIEW_METRIC_TRACKER: ReportConfig = {

  code: 'ReviewMetricTracker',

  name: 'Review / Metric Tracker',

   actionKey: 'ReviewMetricTracker',

  filters: [

    { ...reportingYear, required: true },

    { ...quarter, required: true },

    { ...topic, required: true },

    { ...topLevelMetric, required: true },

    // { ...l1Metric, required: false },

    { ...projectPin, required: false },

    { ...projectName, required: false },

    { ...cpm, required : false },

    { ...programLeader, required: false },

    { ...globalExecutionLeader, required: false },

    { ...fundingRecipient, required:  false},

    { ...program, required: false },

    { ...countryCity, required: false },

    { ...projectStatus, required: false },

    { ...projectCategory, required: false },


    { ...sourceType, required: false },

    { ...customerDateRange, required: false },

    // { ...recordStatus, required:  false }

  ]

};

export const PROJECT_REPORT_CPM: ReportConfig = {

  code: 'ProjectReportCPM',

  name: 'Project Report (for CPM)',

  actionKey: 'ProjectReportCPM',  // Key name present in DB PageActionStructure for reporting (infutre Key change check from DB)

  filters: [

    { ...reportingYear, required: true },

    { ...quarter, required: false },

    { ...topic, required: false },

    { ...topLevelMetric, required: false },

     { ...l1Metric, required: false },

    { ...projectPin, required: false },

    // { ...projectName, required: true },

    { ...cpm, required: false },

     { ...programLeader, required: false },

    { ...globalExecutionLeader, required: false },

    { ...fundingRecipient, required: false },

    { ...program, required: false },

    { ...countryCity, required: false },

      { ...projectStatus, required: false },

    { ...projectCategory, required: false },


   


     { ...recordStatus, required:  false },

      { ...customerDateRange, required: false },
  ]

};


export const RISKADJUSTED_PORTFOLIO: ReportConfig = {

  code: 'RiskAdjustedPortfolio',

  name: 'Risk-Adjusted Portfolio',

  actionKey: 'AnnualPortfolio',  // Key name present in DB PageActionStructure for reporting (infutre Key change check from DB)

  filters: [

    { ...reportingYear, required: true },

    // { ...quarter, required: true },

    { ...projectPin, required: false },

    { ...projectName, required: false },

    { ...cpm, required: false },

    { ...programLeader, required: false },

    { ...globalExecutionLeader, required: false },

    { ...fundingRecipient, required: false },

    { ...program, required: false },

    { ...countryCity, required: false },

    
    { ...projectStatus, required: false },

    { ...projectCategory, required: false },

    { ...sourceType, required: false },

    // {... customerDateRange, required:false}

     { ...recordStatus, required:  false }

  ]

};

export const PROJECTS_PORTFOLIO: ReportConfig = {

  code: 'ProjectsPortfolio',

  name: 'Projects Portfolio',

   actionKey: 'ProjectsPortfolio',

  filters: [

    { ...reportingYear, required: true },

    { ...quarter, required: true },

    { ...projectPin, required: false },

    // { ...projectName, required: false },
    

    { ...cpm, required: false },
   { ...programLeader, required: false },

    { ...globalExecutionLeader, required: false },

    { ...fundingRecipient, required: false },

    { ...program, required: false },

    { ...countryCity, required: false },

    { ...projectStatus, required: false },

    { ...projectCategory, required: false },
    

    { ...recordStatus, required: false },
  
  ]

};


export const TOP_LEVEL_METRIC: ReportConfig = {

  code: 'TopLevelMetric',

  name: 'Top-level Metric (Qtr)',

  actionKey: 'PerTopLevelMetric',  // Key name present in DB PageActionStructure for reporting (infutre Key change check from DB)

  filters: [

    { ...reportingYear, required: true },


    { ...topLevelMetric, required: true },
    // { ...l1Metric, required: false },

    { ...projectPin, required: false },

    { ...projectName, required: false },

    { ...cpm, required: false },

      { ...programLeader, required: false },

    { ...globalExecutionLeader, required: false },

    { ...program, required: false },

    { ...projectStatus, required: false },

        { ...projectCategory, required: false },

        { ...sourceType, required: false },


    { ...recordStatus, required: false }

  ]

};

export const REPORT_CONFIGS: ReportConfig[] = [
  PROJECT_REPORT_CPM,
  PROJECTS_PORTFOLIO,
  REVIEW_METRIC_TRACKER,
  RISKADJUSTED_PORTFOLIO,
  SUMMARY_SINCE_INCEPTION,
  TOP_LEVEL_METRIC
];