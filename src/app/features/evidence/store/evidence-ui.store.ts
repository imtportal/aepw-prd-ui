import { signal } from '@angular/core';
import { EvidenceStatus } from '../models/evidence.model';

export function createEvidenceUiStore() {
  const searchQuery      = signal('');
  const selectedStatus   = signal<EvidenceStatus | 'all'>('all');
  const selectedFileType = signal<'pdf' | 'image' | 'excel' | 'all'>('all');
  const currentPage      = signal(1);
  const pageSize         = signal(10);

  return { searchQuery, selectedStatus, selectedFileType, currentPage, pageSize };
}

export type EvidenceUiStore = ReturnType<typeof createEvidenceUiStore>;
