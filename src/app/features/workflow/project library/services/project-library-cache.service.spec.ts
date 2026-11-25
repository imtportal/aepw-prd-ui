import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PaginationPreferenceService } from '../../../../core/services/pagination-preference.service';
import { PAGINATION_KEYS } from '../../../../shared/constants/pagination.constant';
import { ProjectLibraryCacheService } from './project-library-cache.service';

describe('ProjectLibraryCacheService sidebar reset', () => {
  const paginationKey = `aepw:pagination:${PAGINATION_KEYS.PROJECT_LIBRARY}`;
  const otherKey = `aepw:pagination:${PAGINATION_KEYS.PROJECT_MANAGEMENT}`;

  beforeEach(() => {
    localStorage.removeItem(paginationKey);
    localStorage.removeItem(otherKey);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.removeItem(paginationKey);
    localStorage.removeItem(otherKey);
  });

  it('notifies an open library to clear filters and resets the page while preserving rows per page', () => {
    const cache = TestBed.inject(ProjectLibraryCacheService);
    const pagination = TestBed.inject(PaginationPreferenceService);
    pagination.page(PAGINATION_KEYS.PROJECT_LIBRARY).set(3);
    pagination.pageSize(PAGINATION_KEYS.PROJECT_LIBRARY).set(50);
    const reset = vi.fn(() => {
      expect(pagination.page(PAGINATION_KEYS.PROJECT_LIBRARY)()).toBe(0);
      expect(pagination.pageSize(PAGINATION_KEYS.PROJECT_LIBRARY)()).toBe(50);
    });
    cache.preferencesReset$.subscribe(reset);

    cache.resetPreferences();
    TestBed.tick();

    expect(reset).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem(paginationKey)!)).toEqual({ page: 0, pageSize: 50 });
  });

  it('preserves rows per page restored from localStorage on a fresh sidebar visit', () => {
    localStorage.setItem(paginationKey, JSON.stringify({ page: 4, pageSize: 20 }));
    const cache = TestBed.inject(ProjectLibraryCacheService);

    cache.resetPreferences();
    TestBed.tick();

    const pagination = TestBed.inject(PaginationPreferenceService);
    expect(pagination.page(PAGINATION_KEYS.PROJECT_LIBRARY)()).toBe(0);
    expect(pagination.pageSize(PAGINATION_KEYS.PROJECT_LIBRARY)()).toBe(20);
    expect(JSON.parse(localStorage.getItem(paginationKey)!)).toEqual({ page: 0, pageSize: 20 });
  });

  it('leaves other pages unchanged on reset', () => {
    const cache = TestBed.inject(ProjectLibraryCacheService);
    const pagination = TestBed.inject(PaginationPreferenceService);
    pagination.pageSize(PAGINATION_KEYS.PROJECT_LIBRARY).set(20);
    pagination.page(PAGINATION_KEYS.PROJECT_MANAGEMENT).set(2);
    pagination.pageSize(PAGINATION_KEYS.PROJECT_MANAGEMENT).set(50);

    expect(pagination.pageSize(PAGINATION_KEYS.PROJECT_LIBRARY)()).toBe(20);

    cache.resetPreferences();
    TestBed.tick();

    expect(JSON.parse(localStorage.getItem(otherKey)!)).toEqual({ page: 2, pageSize: 50 });
  });
});
