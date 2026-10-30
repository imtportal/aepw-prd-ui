import { ReviewListDto } from '../reviews/models/review.model';

export type ActiveFilterKey = 'searchId' | 'filterPM' | 'filterStage';
export interface ActiveFilter { label: string; key: ActiveFilterKey }

export function buildFilters(search: string, pm: string, stage: string): ActiveFilter[] {
  const filters: ActiveFilter[] = [];
  if (pm && pm !== 'all')      filters.push({ label: `PM: ${pm}`,       key: 'filterPM'    });
  if (stage && stage !== 'all')   filters.push({ label: `Stage: ${stage}`, key: 'filterStage' });
  if (search.trim())     filters.push({ label: `Search: ${search.trim()}`, key: 'searchId' });
  return filters;
}

export function applyFilters(
  reviews: ReviewListDto[],
  search: string,
  pm: string,
  stage: string,
  sortField: 'updatedAt' | 'project' | null,
  sortDir: 'asc' | 'desc',
): ReviewListDto[] {
  let result = [...reviews];

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      r => r.projectId.toString().toLowerCase().includes(q) || r.project.toLowerCase().includes(q),
    );
  }
  if (pm && pm !== 'all')    result = result.filter(r => r.pm === pm);
  if (stage && stage !== 'all') result = result.filter(r => r.stage === stage);

  if (sortField) {
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }
  return result;
}
