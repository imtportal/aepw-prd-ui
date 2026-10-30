import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectViewPage } from './project-view-page.component';

describe('ProjectViewPage', () => {
  let component: ProjectViewPage;
  let fixture: ComponentFixture<ProjectViewPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectViewPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
