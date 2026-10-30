import { buildFilters, applyFilters } from './dashboard.types';
import { Review } from '../reviews/models/review.model';

const REVIEWS: Review[] = [
  { projectId: '2023-0042', project: 'Project Hydra - Southeast Asia', pm: 'Sarah Chen',   recipient: 'Nguyen Thi Lan', stage: 'Evidence Collection', dataCompletion: 100, evidenceConfirmed: 72,  updatedAt: '2025-07-18T14:32:00' },
  { projectId: '2024-0015', project: 'Clean Coast Initiative',         pm: 'Kwame Asante', recipient: 'Fatima Diallo',  stage: 'Due',                dataCompletion: 0,   evidenceConfirmed: 0,   updatedAt: '2025-07-01T09:00:00' },
  { projectId: '2022-0008', project: 'Circular Plastics Fund - India', pm: 'Sarah Chen',   recipient: 'Rajesh Kumar',   stage: 'Approval',           dataCompletion: 100, evidenceConfirmed: 95,  updatedAt: '2025-07-20T11:05:00' },
];

describe('buildFilters', () => {
  it('returns empty array when all filters are default', () => {
    expect(buildFilters('', 'all', 'all')).toEqual([]);
  });

  it('returns PM chip when filterPM is set', () => {
    expect(buildFilters('', 'Sarah Chen', 'all')).toEqual([{ label: 'PM: Sarah Chen', key: 'filterPM' }]);
  });

  it('returns Stage chip when filterStage is set', () => {
    expect(buildFilters('', 'all', 'Approval')).toEqual([{ label: 'Stage: Approval', key: 'filterStage' }]);
  });

  it('returns Search chip when search is non-empty', () => {
    expect(buildFilters('Hydra', 'all', 'all')).toEqual([{ label: 'Search: Hydra', key: 'searchId' }]);
  });

  it('returns all three chips when all filters are active', () => {
    const result = buildFilters('Hydra', 'Sarah Chen', 'Approval');
    expect(result).toHaveLength(3);
    expect(result.map(f => f.key)).toEqual(['filterPM', 'filterStage', 'searchId']);
  });
});

describe('applyFilters', () => {
  it('returns all reviews when no filters active', () => {
    expect(applyFilters(REVIEWS, '', 'all', 'all', null, 'desc')).toHaveLength(3);
  });

  it('filters by search matching projectId', () => {
    const result = applyFilters(REVIEWS, '2023-0042', 'all', 'all', null, 'desc');
    expect(result).toHaveLength(1);
    expect(result[0].projectId).toBe('2023-0042');
  });

  it('filters by search matching project name case-insensitively', () => {
    const result = applyFilters(REVIEWS, 'hydra', 'all', 'all', null, 'desc');
    expect(result).toHaveLength(1);
    expect(result[0].projectId).toBe('2023-0042');
  });

  it('filters by PM', () => {
    const result = applyFilters(REVIEWS, '', 'Sarah Chen', 'all', null, 'desc');
    expect(result).toHaveLength(2);
    expect(result.every(r => r.pm === 'Sarah Chen')).toBe(true);
  });

  it('filters by stage', () => {
    const result = applyFilters(REVIEWS, '', 'all', 'Approval', null, 'desc');
    expect(result).toHaveLength(1);
    expect(result[0].stage).toBe('Approval');
  });

  it('sorts by updatedAt desc', () => {
    const result = applyFilters(REVIEWS, '', 'all', 'all', 'updatedAt', 'desc');
    expect(result[0].updatedAt > result[1].updatedAt).toBe(true);
  });

  it('sorts by project asc', () => {
    const result = applyFilters(REVIEWS, '', 'all', 'all', 'project', 'asc');
    expect(result[0].project < result[1].project).toBe(true);
  });

  it('returns empty array when no reviews match', () => {
    expect(applyFilters(REVIEWS, 'NOMATCH', 'all', 'all', null, 'desc')).toHaveLength(0);
  });
});
