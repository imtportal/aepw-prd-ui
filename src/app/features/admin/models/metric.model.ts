// ── Entities ──────────────────────────────────────────────────────────────────

export interface MetricCategory {
  categoryId: number;
  code: string;
  name: string;
  color: string | null;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

export interface MetricUnit {
  metricUnitId: number;
  unitCode: string;
  unitName: string;
  description: string | null;
  isActive: boolean;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

export interface Metric {
  metricId: number;
  code: string;
  name: string;
  description: string | null;
  categoryId: number;
  unit: string | null;
  isTopLevel: boolean;
  parentMetricId: number | null;
  isCorporate: boolean;
  defaultRiskPct: number | null;

  riskOriginal?: number;
  riskPctEffective?: number;
  categoryColor?: string;
  categoryCode?: string;
  categoryName?: string;

  evidenceRequiredMin: number;
  isActive: boolean;
  effectiveFromUtc: string | null;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}
export interface MetricEvidenceType {
  id: number;
  description?: string;
  metricId: number;
  evidenceTypeId: number;
  isRequired: boolean;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

// ── DTOs (moved from project.model.ts, IDs aligned to number) ────────────────

export interface MetricDto {
  metricId: number;
  metricCode: string;
  metricName: string;
  description: string | null;
  isTopLevel: boolean;
  parentMetricId: number | null;
  parentMetricName: string | null;
  isCorporate: boolean;
  defaultRiskPct: number | null;
  evidenceRequiredMin: number;
  isActive: boolean;
  effectiveFromUtc: string;
  metricUnitId: number | null;
  unitName: string | null;
  projectMetricId: number | null;
  isSelected: boolean;
  baselineRiskPct: number | null;
  isRequired: boolean;
  children: MetricDto[];
}

export interface MetricCategoryDto {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  categoryColor: string | null;
  metrics: MetricDto[];
}
// -------------------------------------BINDING MODELS----------------------------------------

export interface MetricCategory2 {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryDescription: string;
  categoryColor?: string | null;
  l4ApproverUserId?: string | null;
  l4ApproverName?: string | null;
  metrics: Metric2[];
}

export interface Metric2 {
  metricId: string;

  metricCode: string;

  metricName: string;
  description?: string | null;
  metricHeader?: string | null;

  isTopLevel: boolean;

  parentMetricId?: string | null;

  parentMetricName?: string | null;

  isActive: boolean;

  metricUnitId?: string | null;

  unitName?: string | null;

  metricSourceId?: string | null;
  metricSourceCode?: string | null;
  metricSourceName?: string | null;

  isRiskAdjustmentRequired: boolean;

  isICPRequired: boolean;

  icpApproverUserId?: string | null;
  icpApproverName?: string | null;

  evidenceTypes: MetricEvidenceType2[];

  children: Metric2[];
}
export interface MetricEvidenceType2 {
  evidenceTypeId: string;

  code: string;

  description: string;

  isRequired: boolean;
}
// SAVE MODELS
export interface MetricConfigurationSaveRequest {
  metricCategories: MetricCategoryConfiguration[];
  metrics: MetricConfiguration[];
  userId: number;
}

export interface MetricCategoryConfiguration {
  categoryId: string;
  categoryDescription?: string | null;
  l4ApproverUserId?: string | null;
}

export interface MetricConfiguration {
  metricId: string;
  description?: string | null;
  metricHeader?: string | null;

  metricSourceId?: string | null;

  isICPRequired: boolean;

  isRiskAdjustmentRequired: boolean;

  icpApproverUserId?: string | null;

  isActive: boolean;
}












































