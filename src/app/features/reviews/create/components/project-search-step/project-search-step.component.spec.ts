import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectSearchStepComponent } from './project-search-step.component';
import { Project } from '../../../../admin/models/project.model';

const MOCK_PROJECTS: Project[] = [
  {
    projectId:        '2023-0042',
    projectName:      'Project Hydra - Southeast Asia',
    program:          'Indonesia Program',
    region:           'Southeast Asia',
    country:          'Indonesia',
    status:           'Active',
    startDate:        '2023-01-15',
    pm:               'Sarah Chen',
    fundingRecipient: { name: 'Ahmad', organization: 'InfinityBox', email: 'a@b.com' },
    totalFunding:     '$2.5M',
    metricConfig:     [],
  },
  {
    projectId:        '2024-0015',
    projectName:      'Clean Coast Initiative - West Africa',
    program:          'Non-program',
    region:           'West Africa',
    country:          'Ghana',
    status:           'Active',
    startDate:        '2024-03-01',
    pm:               'Kwame Asante',
    fundingRecipient: { name: 'Kofi', organization: 'Ghana Coastal', email: 'k@g.org' },
    totalFunding:     '$1.8M',
    metricConfig:     [],
  },
  {
    projectId:        '2022-0008',
    projectName:      'Circular Plastics Fund - India',
    program:          'India Program',
    region:           'South Asia',
    country:          'India',
    status:           'Active',
    startDate:        '2022-06-01',
    pm:               'Priya Sharma',
    fundingRecipient: { name: 'Rajesh', organization: 'CircularIndia', email: 'r@ci.org' },
    totalFunding:     '$5.2M',
    metricConfig:     [],
  },
];

describe('ProjectSearchStepComponent', () => {
  let fixture:   ComponentFixture<ProjectSearchStepComponent>;
  let component: ProjectSearchStepComponent;

  beforeEach(async () => {
    vi.useFakeTimers();  // MUST be before compileComponents so RxJS picks up fake scheduler
    await TestBed.configureTestingModule({
      imports: [ProjectSearchStepComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(ProjectSearchStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projects', MOCK_PROJECTS);
    fixture.componentRef.setInput('selectedId', null);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all projects when search is empty', () => {
    const options = fixture.nativeElement.querySelectorAll('[data-project-option]');
    expect(options.length).toBe(3);
  });

  it('filters projects by projectId after 300ms debounce', async () => {
    component.searchQuery.set('2023-0042');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    TestBed.flushEffects();
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('[data-project-option]');
    expect(options.length).toBe(1);
    expect(options[0].getAttribute('data-project-id')).toBe('2023-0042');
  });

  it('filters projects by projectName after 300ms debounce', async () => {
    component.searchQuery.set('Clean Coast');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    TestBed.flushEffects();
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('[data-project-option]');
    expect(options.length).toBe(1);
    expect(options[0].getAttribute('data-project-id')).toBe('2024-0015');
  });

  it('does not filter before 300ms debounce fires', async () => {
    component.searchQuery.set('Hydra');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(299);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('[data-project-option]');
    expect(options.length).toBe(3);
  });

  it('data-selected="true" on the row whose projectId === selectedId()', () => {
    fixture.componentRef.setInput('selectedId', '2023-0042');
    fixture.detectChanges();
    const selected = fixture.nativeElement.querySelector('[data-selected="true"]');
    expect(selected).toBeTruthy();
    expect(selected.getAttribute('data-project-id')).toBe('2023-0042');
  });

  it('clicking a project row emits selectProject with projectId', () => {
    let emitted: string | undefined;
    component.selectProject.subscribe((id: string) => (emitted = id));
    fixture.nativeElement.querySelector('[data-project-option]').click();
    expect(emitted).toBe('2023-0042');
  });

  it('data-no-results shown when filteredProjects() is empty', async () => {
    component.searchQuery.set('ZZZZZ-NO-MATCH');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-no-results]')).toBeTruthy();
  });
});
