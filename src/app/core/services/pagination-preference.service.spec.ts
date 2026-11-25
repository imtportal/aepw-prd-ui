import { TestBed } from '@angular/core/testing';

import { PaginationPreferenceService } from './pagination-preference.service';

const storageKey = (key: string) => `aepw:pagination:${key}`;

describe('PaginationPreferenceService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => sessionStorage.clear());

  it('defaults to the first page and 10 rows per page', () => {
    const service = TestBed.inject(PaginationPreferenceService);

    expect(service.page('A')()).toBe(0);
    expect(service.pageSize('A')()).toBe(10);
  });

  it('persists page and page size to sessionStorage per key', () => {
    const service = TestBed.inject(PaginationPreferenceService);

    service.page('A').set(3);
    service.pageSize('A').set(20);
    service.page('B').set(1);
    service.pageSize('B').set(50);
    TestBed.tick();

    expect(JSON.parse(sessionStorage.getItem(storageKey('A'))!)).toEqual({ page: 3, pageSize: 20 });
    expect(JSON.parse(sessionStorage.getItem(storageKey('B'))!)).toEqual({ page: 1, pageSize: 50 });
    expect(service.page('A')()).toBe(3);
  });

  it('restores stored values for a key', () => {
    sessionStorage.setItem(storageKey('A'), JSON.stringify({ page: 4, pageSize: 50 }));
    const service = TestBed.inject(PaginationPreferenceService);

    expect(service.page('A')()).toBe(4);
    expect(service.pageSize('A')()).toBe(50);
  });

  it('falls back to defaults for invalid or corrupt stored values', () => {
    sessionStorage.setItem(storageKey('A'), JSON.stringify({ page: -2, pageSize: 33 }));
    sessionStorage.setItem(storageKey('B'), '{not json');
    const service = TestBed.inject(PaginationPreferenceService);

    expect(service.page('A')()).toBe(0);
    expect(service.pageSize('A')()).toBe(10);
    expect(service.page('B')()).toBe(0);
    expect(service.pageSize('B')()).toBe(10);
  });
});
