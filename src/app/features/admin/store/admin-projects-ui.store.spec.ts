import { createAdminProjectsUiStore } from './admin-projects-ui.store';

describe('createAdminProjectsUiStore', () => {
  it('has default initial state', () => {
    const s = createAdminProjectsUiStore();
    expect(s.searchQuery()).toBe('');
    expect(s.selectedProgram()).toBe('all');
    expect(s.showAddModal()).toBe(false);
    expect(s.editingProjectId()).toBeNull();
  });

  it('signals are writable', () => {
    const s = createAdminProjectsUiStore();
    s.searchQuery.set('Hydra');
    s.showAddModal.set(true);
    s.editingProjectId.set('2023-0042');
    expect(s.searchQuery()).toBe('Hydra');
    expect(s.showAddModal()).toBe(true);
    expect(s.editingProjectId()).toBe('2023-0042');
  });
});
