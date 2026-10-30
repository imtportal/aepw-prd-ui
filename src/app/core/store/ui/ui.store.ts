import { signal } from '@angular/core';

export const uiStore = {
  sidebarOpen: signal(false),
  pageLoading: signal(false),
  setPageLoading: (loading: boolean) => {
    uiStore.pageLoading.set(loading);
  },
  toggleSidebar: () => uiStore.sidebarOpen.update((v) => !v),
};
