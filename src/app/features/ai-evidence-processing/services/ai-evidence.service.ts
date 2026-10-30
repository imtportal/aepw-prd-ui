import { Injectable, signal } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ProcessingFile, FileProcessingStatus } from '../models/ai-evidence.model';
import { PaginatedResponse, PagedRequest } from '../../../core/models/api-response.model';

const MOCK_FILES: ProcessingFile[] = [
  { id: 'e1', fileName: 'collection_report_jul.pdf', fileType: 'pdf', projectId: '2023-0042', projectName: 'Project Hydra - Southeast Asia', period: 'Q3 2025', metricCode: 'MW1.11', uploadedAt: '2025-08-15T09:30:00Z', status: 'pending', confidence: 92, pm: 'Sarah Chen', uploadedBy: 'Sarah Chen' },
  { id: 'e2', fileName: 'weighbridge_tickets_aug.xlsx', fileType: 'excel', projectId: '2023-0042', projectName: 'Project Hydra - Southeast Asia', period: 'Q3 2025', metricCode: 'MW1.11', uploadedAt: '2025-09-02T11:00:00Z', status: 'validated', confidence: 98, pm: 'Sarah Chen', uploadedBy: 'Sarah Chen' },
  { id: 'e3', fileName: 'site_photo_sep.jpg', fileType: 'image', projectId: '2024-0015', projectName: 'Clean Coast Initiative - West Africa', period: 'Q3 2025', metricCode: 'MW1.12', uploadedAt: '2025-09-18T14:15:00Z', status: 'needs-review', confidence: 74, pm: 'Kwame Asante', uploadedBy: 'Local Partner' },
  { id: 'e4', fileName: 'recycling_manifest_q3.pdf', fileType: 'pdf', projectId: '2022-0008', projectName: 'Circular Plastics Fund - India', period: 'Annual 2025', metricCode: 'CV-01', uploadedAt: '2025-09-10T08:45:00Z', status: 'rejected', confidence: 61, pm: 'Priya Sharma', uploadedBy: 'Sarah Chen' },
  { id: 'e5', fileName: 'training_schedule.pdf', fileType: 'pdf', projectId: '2024-0031', projectName: 'EcoSchools Program - Latin America', period: 'Q3 2025', metricCode: 'EE-01', uploadedAt: '2025-09-01T10:00:00Z', status: 'processing', confidence: 88, pm: 'Carlos Mendez', uploadedBy: 'Carlos Mendez' },
];

function pagedResult<T>(params: PagedRequest, data: T[]): Observable<PaginatedResponse<T>> {
  const rows = [...data];
  if (params.sortBy) {
    const key = params.sortBy as keyof T;
    const dir = params.sortDir === 'desc' ? -1 : 1;
    rows.sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir);
  }
  const total = rows.length;
  const start = params.page * params.pageSize;
  return timer(120).pipe(switchMap(() =>
    of({ data: rows.slice(start, start + params.pageSize), total, page: params.page, pageSize: params.pageSize, message: '', status: 200 }),
  ));
}

@Injectable({ providedIn: 'root' })
export class AiEvidenceService {
  private readonly _files = signal<ProcessingFile[]>([...MOCK_FILES]);
  readonly files   = this._files.asReadonly();
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  loadPaged(params: PagedRequest): Observable<PaginatedResponse<ProcessingFile>> {
    let data = this._files();
    const search = (params.filters?.['search'] ?? '').toLowerCase();
    const status = params.filters?.['status'] ?? '';
    const confidence = params.filters?.['confidence'] ?? '';

    if (search) {
      data = data.filter(file =>
        file.fileName.toLowerCase().includes(search) ||
        file.projectName.toLowerCase().includes(search) ||
        file.metricCode.toLowerCase().includes(search),
      );
    }
    if (status && status !== 'all') data = data.filter(file => file.status === status);
    if (confidence === 'low') data = data.filter(file => (file.confidence ?? 0) < 85);
    if (confidence === 'high') data = data.filter(file => (file.confidence ?? 0) >= 85);

    return pagedResult(params, data);
  }

  updateStatus(id: string, status: FileProcessingStatus): void {
    this._files.update(files =>
      files.map(f => f.id === id ? { ...f, status } : f),
    );
  }

  reprocess(id: string): void {
    this.updateStatus(id, 'queued');
  }
}
