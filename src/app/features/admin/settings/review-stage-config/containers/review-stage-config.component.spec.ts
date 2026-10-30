import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewStageManagement } from './review-stage-config.component';

describe('ReviewPeriodManagement', () => {
  let component: ReviewStageManagement;
  let fixture: ComponentFixture<ReviewStageManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewStageManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewStageManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
