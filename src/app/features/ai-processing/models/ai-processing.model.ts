export type ProcessingStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'needs-review'
  | 'error';

export interface ExtractedFields {
  challanNo?: string;
  date?: string;
  client?: string;
  material?: string;
  quantity?: number;
  weight?: number;
}

export interface QueueItem {
  id:              string;
  fileName:        string;
  fileType:        'pdf' | 'image' | 'excel';
  projectId:       string;
  projectName:     string;
  period:          string;
  metricCode:      string;
  metricName:      string;
  uploadedAt:      string;
  processedAt?:    string;
  status:          ProcessingStatus;
  confidence?:     number;
  extracted?:      ExtractedFields;
  validationNote?: string;
  processingTime?: string;
}
