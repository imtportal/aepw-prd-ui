import { signal, computed } from '@angular/core';
import { UserRole } from '../../models/user.model';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  initials: string;
  projects: unknown[];
  createdAt: string;
}

const currentUser = signal<AuthUser | null>(null);

export const authStore = {
  currentUser,
  isAuthenticated: computed(() => currentUser() !== null),
  role:            computed(() => currentUser()?.role ?? null),
  setUser:         (user: AuthUser) => currentUser.set(user),
  clearUser:       ()               => currentUser.set(null),
};
