import { TestBed } from '@angular/core/testing';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let svc: ProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ProjectService);
  });

  it('projects() returns initial list', () => {
    expect(svc.projects().length).toBeGreaterThan(0);
  });

  it('bulkProjects() returns initial list', () => {
    expect(svc.bulkProjects().length).toBeGreaterThan(0);
  });

  it('getProject() returns project by id', () => {
    const id = svc.projects()[0].projectId;
    expect(svc.getProject(id)).not.toBeNull();
  });

  it('updateProject() mutates the status field', () => {
    const id = svc.projects()[0].projectId;
    svc.updateProject(id, { status: 'Completed' });
    expect(svc.projects().find(p => p.projectId === id)?.status).toBe('Completed');
  });
});
