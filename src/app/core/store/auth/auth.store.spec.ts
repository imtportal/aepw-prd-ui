import { authStore } from './auth.store';

const mockUser = {
  id: '1', name: 'Sarah Chen', email: 'sarah@aepw.org',
  role: 'Project Manager' as const, status: 'Active', initials: 'SC',
  projects: [], createdAt: '2024-01-01',
};

describe('authStore', () => {
  beforeEach(() => authStore.clearUser());

  it('currentUser defaults to null', () => {
    expect(authStore.currentUser()).toBeNull();
  });

  it('isAuthenticated is false when no user', () => {
    expect(authStore.isAuthenticated()).toBe(false);
  });

  it('setUser populates currentUser', () => {
    authStore.setUser(mockUser);
    expect(authStore.currentUser()).toEqual(mockUser);
  });

  it('isAuthenticated is true after setUser', () => {
    authStore.setUser(mockUser);
    expect(authStore.isAuthenticated()).toBe(true);
  });

  it('role returns the user role', () => {
    authStore.setUser(mockUser);
    expect(authStore.role()).toBe('Project Manager');
  });

  it('clearUser resets to null', () => {
    authStore.setUser(mockUser);
    authStore.clearUser();
    expect(authStore.currentUser()).toBeNull();
    expect(authStore.role()).toBeNull();
  });
});
