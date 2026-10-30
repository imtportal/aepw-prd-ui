// ── Enum / union types ────────────────────────────────────────────────────────

export type EvidenceStatus = 'Pending' | 'Processing' | 'Validated' | 'NeedsReview' | 'Rejected';

// ── Entities ──────────────────────────────────────────────────────────────────

export interface EvidenceType {
  evidenceTypeId: number;
  code:           string;
  description:    string;
  isActive:       boolean;
  createdBy:      number;
  createdOnUtc:   string;
  updatedBy:      number | null;
  updatedOnUtc:   string | null;
  rowVersion:     string;
}

export interface Evidence {
  evidenceId:         number;
  reviewMetricId:     number;
  evidenceTypeId:     number;
  fileName:           string;
  mimeType:           string | null;
  fileSizeBytes:      number | null;
  blobUri:            string;
  siteTag:            string | null;
  period:             string | null;
  language:           string | null;
  uploadedByUserId:   number;
  uploadedUtc:        string;
  status:             EvidenceStatus;
  isLocked:           boolean;
  createdBy:          number;
  createdOnUtc:       string;
  updatedBy:          number | null;
  updatedOnUtc:       string | null;
  rowVersion:         string;
}

// ── DTOs (view models for list and detail pages) ──────────────────────────────

export interface EvidenceListDto {
  evidenceId:      number;
  fileName:        string;
  fileType:        'pdf' | 'image' | 'excel';
  projectId:       number;
  projectName:     string;
  period:          string;
  pm:              string;
  metricCode:      string;
  uploadedAt:      string;
  uploadedBy:      string;
  status:          EvidenceStatus;
  aiConfidence?:   number;
  validationNote?: string;
}

export interface EvidenceDetailDto {
  evidenceId:     number;
  evidenceTypeId: number;
  fileName:       string;
  evidenceType:   string;
  siteTag?:       string;
  uploadedBy:     string;
  uploadedDate:   string;
  status:         'pending' | 'complete';
}
