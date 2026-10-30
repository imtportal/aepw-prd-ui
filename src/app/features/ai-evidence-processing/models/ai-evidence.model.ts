export type FileProcessingStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'validated'
  | 'needs-review'
  | 'rejected'
  | 'error';

export type AiEvidenceRole = string;

export interface ExtractedFields {
  challanNo?: string;
  date?:      string;
  client?:    string;
  material?:  string;
  quantity?:  number;
  weight?:    number;
}

export interface ProcessingFile {
  // Core — present in both EvidenceFile and QueueItem
  id:              string;
  fileName:        string;
  fileType:        'pdf' | 'image' | 'excel';
  projectId:       string;
  projectName:     string;
  period:          string;
  metricCode:      string;
  uploadedAt:      string;
  status:          FileProcessingStatus;
  validationNote?: string;

  // AI Processing fields (from QueueItem)
  metricName?:     string;
  processedAt?:    string;
  processingTime?: string;
  extracted?:      ExtractedFields;

  // Unified confidence — was aiConfidence in EvidenceFile, confidence in QueueItem
  confidence?:     number;

  // Evidence fields (from EvidenceFile)
  pm?:             string;
  uploadedBy?:     string;
}
