import { Injectable } from '@angular/core';

export interface ProjectLibraryFilterState {
  searchQuery: string | null;
  selectedProgramId: string | null;
  selectedRecordTypeId: string | null;
  selectedStatusId: string | null;
  selectedL1UserId: string | null;
  selectedImpactMasterId: string | null;
  selectedImpactMasterPin: string | null; // Store PIN for better search
  selectedImpactMasterTitle: string | null;
  selectedFundingRecipientId: string | null;
  selectedFundingRecipientName: string | null;
  selectedMetricCategories: string[];
  isMyProjects: boolean;
  currentPage: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectLibraryCacheService {
  private readonly CACHE_KEY = 'projectLibraryFilterState';

  constructor() {}

  /**
   * Save filter state to localStorage
   */
  saveFilterState(state: Partial<ProjectLibraryFilterState>): void {
    try {
      const currentState = this.getFilterState();
      const newState = { ...currentState, ...state };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to save filter state to localStorage', error);
    }
  }

  /**
   * Get filter state from localStorage
   */
  getFilterState(): ProjectLibraryFilterState {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as ProjectLibraryFilterState;
      }
    } catch (error) {
      console.error('Failed to retrieve filter state from localStorage', error);
    }

    return this.getDefaultState();
  }

  /**
   * Clear filter state from localStorage
   */
  clearFilterState(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear filter state from localStorage', error);
    }
  }

  /**
   * Get default empty state
   */
  private getDefaultState(): ProjectLibraryFilterState {
    return {
      searchQuery: null,
      selectedProgramId: null,
      selectedRecordTypeId: null,
      selectedStatusId: null,
      selectedL1UserId: null,
      selectedImpactMasterId: null,
      selectedImpactMasterPin: null,
      selectedImpactMasterTitle: null,
      selectedFundingRecipientId: null,
      selectedFundingRecipientName: null,
      selectedMetricCategories: [],
      isMyProjects: false,
      currentPage: 0,
      pageSize: 10,
    };
  }
}
