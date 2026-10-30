export type EvidenceDataType = 'string' | 'number' | 'date' | 'time' | 'lookup';

export type ValidationStatus = 'Success' | 'Warning' | 'Error';

export interface EvidenceFile {
  fileName: string;
  fileType: string;
  evidenceUrl: string;
  downloadUrl: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  // blobContainer: string;
  sourceLabel: string;
}

export interface ExtractionSummary {
  status: string;
  statusTitle: string;
  statusMessage: string;
  fieldsExtracted: number;
  requiredFields: number;
  rulesPassed: number;
  warnings: number;
  failed: number;
  avgConfidenceScore: number | null;
}

export interface EvidenceHeader {
  submissionId: string;
  // agentRunId: string;
  projectName: string;
  metricCode: string;
  evidenceType: string;
  reportingPeriod: string;
  uploadedAt: string;
  evidenceFile: EvidenceFile;
  extractionSummary: ExtractionSummary;
}
export interface EvidencePage {
  pageNumber: number;
  isUnique: boolean;
  details: EvidenceField[];
}

export interface EvidenceField {
  evidenceDetailId: number | null;
  evidenceFieldId: number;
  property: string;
  label: string;
  value: string | null;
  dataType: EvidenceDataType;
  required: boolean;
  // validationCode: string | null;
}
export interface Evidenced {
  fieldName: string | null;
  evidencedValue: string | null;
}
export interface EvidenceValidation {
  validationStatus: string | null;
  validationComment: string | null;
  isWithinReporting: string | null;
}
export interface RawOutput {
  json: Record<string, unknown>;
}

export interface ValidationDetail {
  ruleCode: string;
  validationName: string;
  validationMessage: string;
  validationStatus: ValidationStatus;
  details: string;
  source: string;
  property: string | null;
}

export interface EvidenceDetailResponse {
  headerData: EvidenceHeader;
  evidenceDetail: EvidencePage[];
  evidenced: Evidenced;
  lineItems: EvidenceLineItems;
  validation: EvidenceValidation;
  rawOutput: RawOutput;
  validationData: unknown[];
}

export interface EvidenceLineItem {
  evidenceDetailId: number;
  evidenceFieldId: number;
  name: string;
  value: string | null;
  confidence: number | null;
  pageNumber: number | null;
}

export interface EvidenceLineItems {
  fieldName: string;
  items: EvidenceLineItem[];
}

export interface SaveEvidenceReviewRequest {
  evidenceId: number;
  fields: SaveEvidenceReviewFieldRequest[];
  updatedBy: number;
  evidencedValue?: string | null;
}

export interface SaveEvidenceReviewFieldRequest {
  evidenceDetailId: number;
  value: string | null;
}
// ------------------------------------------------------------

export interface RawDocumentResults {
  documentResults?: RawDocumentResult[];
}

export interface RawDocumentResult {
  pages?: RawEvidencePage[];
}

export interface RawEvidencePage {
  pageNumber: number;
  isUnique?: boolean;
  data?: RawExtractedField[];
  lineItems?: RawLineItems;
}

export interface RawExtractedField {
  fieldName: string;
  value: string | null;
  confidence?: number | null;
}

export interface RawLineItems {
  fieldName?: string;
  items?: RawLineItem[];
}

export interface RawLineItem {
  fieldName: string;
  value: string | null;
  confidence?: number | null;
}
