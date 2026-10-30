import { signal } from '@angular/core';

export function createAdminProjectsUiStore() {
  const searchQuery      = signal('');
  const selectedProgram  = signal<string>('all');
  const selectedStatus   = signal<string>('all');
  const showAddModal     = signal(false);
  const editingProjectId = signal<string | null>(null);

  return { searchQuery, selectedProgram, selectedStatus, showAddModal, editingProjectId };
}

export type AdminProjectsUiStore = ReturnType<typeof createAdminProjectsUiStore>;
