import { Program, ReportingProject, TopLevelMetric, L1Metric } from './reporting.modelold';

describe('reporting.model', () => {
  it('TopLevelMetric and L1Metric shapes', () => {
    const l1: L1Metric = {
      code: 'MW1.11',
      name: 'Controlled landfill',
      reported: 113,
      riskAdjusted: 101.7,
      unit: 'tonnes',
    };
    const t: TopLevelMetric = {
      code: 'MW1.1',
      name: 'Total reduction in unmanaged waste',
      reported: 2409.7,
      riskAdjusted: 1768.2,
      unit: 'tonnes',
      yoyChange: 18,
      l1Metrics: [l1],
    };
    expect(t.l1Metrics.length).toBe(1);
    expect(t.yoyChange).toBe(18);
  });

  it('Program shape', () => {
    const p: Program = {
      id: 'indonesia',
      name: 'Indonesia',
      region: 'Asia Pacific',
      projectCount: 2,
      lat: -2.5,
      lng: 118,
      metrics: [],
    };
    expect(p.projectCount).toBe(2);
    expect(p.lat).toBe(-2.5);
  });

  it('ReportingProject shape', () => {
    const rp: ReportingProject = {
      pin: 'A003A',
      title: 'Rethinking Recycling - Indonesia',
      program: 'Indonesia',
      pm: 'Paola Chabrol',
      status: 'Closed',
      metrics: [],
    };
    expect(rp.pin).toBe('A003A');
    expect(rp.status).toBe('Closed');
  });
});
