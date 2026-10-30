import { computed, Injectable, signal } from '@angular/core';

import {
  LoginContext,
  PageAccess,
  UserDetails,
} from '../models/authorization.model';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  readonly user = signal<UserDetails | null>(null);

  readonly pageAccess = signal<PageAccess[]>([]);
  readonly pageAccessMap = computed(() => new Map(this.pageAccess().map((x) => [x.key, x.value])));
  // readonly actionPermissionMap = computed(
  //   () => new Map(this.actionPermissions().map((x) => [`${x.pageKey}:${x.actionKey}`, x.value])),
  // );
  // readonly actionPermissions = signal<ActionPermission[]>([]);

  initialize(context: LoginContext): void {
    console.log('[AuthState] initialize() called');
    console.log('[AuthState] User:', context.userDetails);
    console.log('[AuthState] Page Access count:', context.pageAccess.length);
    // console.log('[AuthState] Action Permissions count:', context.actionPermissions.length);

    this.user.set(context.userDetails);
    this.pageAccess.set(context.pageAccess);
    // this.actionPermissions.set(context.actionPermissions);

    console.log('[AuthState] Saving LoginContext to sessionStorage');
    sessionStorage.setItem('loginContext', JSON.stringify(context));
    console.log('[AuthState] LoginContext saved successfully');
  }

  restore(): void {
    console.log('[AuthState] restore() called');
    const json = sessionStorage.getItem('loginContext');

    if (!json) {
      console.log('[AuthState] No stored LoginContext found in sessionStorage');
      return;
    }

    console.log('[AuthState] Restoring LoginContext from sessionStorage');
    const context = JSON.parse(json) as LoginContext;

    console.log('[AuthState] Restored user:', context.userDetails);
    console.log('[AuthState] Restored page access count:', context.pageAccess.length);
    // Don't call initialize() here to avoid double-logging and re-saving
    this.user.set(context.userDetails);
    this.pageAccess.set(context.pageAccess);
    // this.actionPermissions.set(context.actionPermissions);
  }

  clear(): void {
    console.log('[AuthState] clear() called');
    sessionStorage.removeItem('loginContext');

    this.user.set(null);
    this.pageAccess.set([]);
    // this.actionPermissions.set([]);
    console.log('[AuthState] Authorization state cleared');
  }

  hasPageAccess(pageKey: string): boolean {
    return this.pageAccessMap().get(pageKey) ?? false;
  }

  // hasActionAccess(pageKey: string, actionKey: string): boolean {
  //   return this.actionPermissionMap().get(`${pageKey}:${actionKey}`) ?? false;
  // }
  getCurrentUserId(): number | null {
    const currentUser = this.user();

    if (currentUser) {
      return currentUser.userId;
    }

    const json = sessionStorage.getItem('loginContext');

    if (!json) {
      return null;
    }

    const context = JSON.parse(json) as LoginContext;
    return context.userDetails.userId;
  }
}
