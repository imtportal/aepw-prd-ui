import { TestBed } from '@angular/core/testing';

import { ReviewMetricConfigPageService } from './review-metric-config-page.service';
describe('ReviewMetricConfigPageService', () => {
  let service: ReviewMetricConfigPageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReviewMetricConfigPageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
