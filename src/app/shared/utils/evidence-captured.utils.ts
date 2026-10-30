// import { ProcessingFile } from '../../features/ai-evidence-processing/models/ai-evidence.model';
import { DetailEvidenceFile } from '../../features/reviews/models/review.model';

/** AI-extracted captured value for one evidence file, converted into the metric's own unit. */
export function extractedValueForFile(
  // aiFiles: ProcessingFile[],
  aiFiles: any[],
  fileId: string,
  metricUnit: string,
): number | null {
  const aiFile = aiFiles.find(f => f.id === fileId);
  if (!aiFile?.extracted) return null;
  const useWeight = metricUnit === 'tonnes';
  const val = useWeight ? aiFile.extracted.weight : aiFile.extracted.quantity;
  return val !== undefined ? (useWeight ? val / 1000 : val) : null;
}

/** A submetric's Captured value = sum of all its evidence files' individual captured values. */
export function sumEvidenceCapturedValue(
  // aiFiles: ProcessingFile[],
  aiFiles: any[],
  evidenceFiles: DetailEvidenceFile[],
  metricUnit: string,
): number | null {
  const vals = evidenceFiles
    .map(f => extractedValueForFile(aiFiles, f.id, metricUnit))
    .filter((v): v is number => v != null);
  return vals.length > 0 ? vals.reduce((s, n) => s + n, 0) : null;
}
