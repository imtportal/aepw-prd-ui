import { Project, BulkProject, MetricConfig } from './project.model';
import { FundingRecipient } from './funding-recipient.model';

describe('project.model', () => {
  it('Project shape', () => {
    const p: Project = {
      projectId:          1,
      pin:                '2023-0042',
      title:              'Project Hydra - Southeast Asia',
      programId:          1,
      fundingRecipientId: 1,
      pmUserId:           1,
      status:             'Active',
      startDate:          '2023-01-15',
      endDate:            null,
      reportingFrequency: 'Quarterly',
      totalFunding:       null,
      createdBy:          1,
      createdOnUtc:       '2023-01-15',
      updatedBy:          null,
      updatedOnUtc:       null,
      rowVersion:         'AAAAAAAAAAM=',
    };
    expect(p.status).toBe('Active');
    expect(p.pin).toBe('2023-0042');
  });

  it('MetricConfig shape', () => {
    const mc: MetricConfig = {
      metricId:        1,
      code:            'MW1.1',
      applicability:   'Required',
      baselineRiskPct: 15,
    };
    expect(mc.applicability).toBe('Required');
    expect(mc.baselineRiskPct).toBe(15);
  });

  it('BulkProject shape', () => {
    const fr: FundingRecipient = {
      fundingRecipientId: 1,
      name:               'Ghana Coastal Clean',
      orgName:            'Ghana Coastal Clean Ltd',
      countryId:          1,
      status:             'Active',
      contactName:        null,
      contactEmail:       'info@gccl.gh',
      contactPhone:       null,
      createdBy:          1,
      createdOnUtc:       '2024-01-01',
      updatedBy:          null,
      updatedOnUtc:       null,
      rowVersion:         'AAA=',
    };
    const bp: BulkProject = {
      projectId:        1,
      pin:              '2024-0015',
      title:            'Clean Coast Initiative - West Africa',
      programName:      'West Africa Program',
      region:           'West Africa',
      pm:               'Kwame Asante',
      fundingRecipient: fr,
      metricConfig:     [{ metricId: 1, code: 'MW1.1', applicability: 'Required', baselineRiskPct: 15 }],
      lastReviewStatus: 'Completed',
      status:           'Active',
    };
    expect(bp.status).toBe('Active');
    expect(bp.fundingRecipient.name).toBe('Ghana Coastal Clean');
  });
});
