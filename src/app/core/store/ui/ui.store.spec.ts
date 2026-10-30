import { TestBed } from '@angular/core/testing';
import { uiStore } from './ui.store';

describe('uiStore', () => {
  beforeEach(() => {
    uiStore.sidebarOpen.set(true);
    uiStore.pageLoading.set(false);
  });

  it('sidebarOpen defaults to true', () => {
    expect(uiStore.sidebarOpen()).toBe(true);
  });

  it('toggleSidebar flips sidebarOpen', () => {
    uiStore.toggleSidebar();
    expect(uiStore.sidebarOpen()).toBe(false);
    uiStore.toggleSidebar();
    expect(uiStore.sidebarOpen()).toBe(true);
  });

  it('pageLoading defaults to false', () => {
    expect(uiStore.pageLoading()).toBe(false);
  });

  it('pageLoading can be set to true', () => {
    uiStore.pageLoading.set(true);
    expect(uiStore.pageLoading()).toBe(true);
  });

  it('setPageLoading toggles the global page loader', () => {
    uiStore.setPageLoading(true);
    expect(uiStore.pageLoading()).toBe(true);

    uiStore.setPageLoading(false);
    expect(uiStore.pageLoading()).toBe(false);
  });
});
