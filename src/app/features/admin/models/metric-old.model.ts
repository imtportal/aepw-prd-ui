export interface Metric {
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  isTopLevel: boolean;
  parent?: string;
  corporate?: boolean;
  evidenceRequired: number;
  defaultRiskFactor: number;
  active: boolean;
}

export interface CategoryDef {
  code: string;
  name: string;
  color: string;
  description: string;
}
