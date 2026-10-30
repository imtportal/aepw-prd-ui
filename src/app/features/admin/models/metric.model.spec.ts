import { Metric } from './metric.model';

describe('metric.model', () => {
  it('Metric shape', () => {
    const m: Metric = {
      metricId:            1,
      code:                'MW1.11',
      name:                'Plastic waste diverted from landfill',
      description:         'Weight of plastic waste diverted from landfill disposal',
      categoryId:          1,
      unit:                'tonnes',
      isTopLevel:          false,
      parentMetricId:      null,
      isCorporate:         false,
      defaultRiskPct:      15,
      evidenceRequiredMin: 5,
      isActive:            true,
      effectiveFromUtc:    null,
      createdBy:           1,
      createdOnUtc:        '2023-01-01',
      updatedBy:           null,
      updatedOnUtc:        null,
      rowVersion:          'AAA=',
    };
    expect(m.isTopLevel).toBe(false);
    expect(m.defaultRiskPct).toBe(15);
  });
});
