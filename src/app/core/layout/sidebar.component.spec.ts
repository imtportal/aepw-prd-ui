import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { provideRouter } from '@angular/router';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.componentRef.setInput('activeUrl', '/');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders AEPW brand text', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('ALLIANCE TO');
    expect(el.textContent).toContain('END PLASTIC WASTE');
  });

  it('renders all three nav group labels', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Workflow');
    expect(el.textContent).toContain('Review & Audit');
    expect(el.textContent).toContain('Administration');
  });

  it('collapses when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    const aside = fixture.nativeElement.querySelector('aside');
    expect(aside.classList.toString()).toContain('w-0');
  });

  it('highlights Project Library on project information routes', () => {
    fixture.componentRef.setInput('activeUrl', '/admin/projects-info/123?from=library');
    fixture.detectChanges();

    const projectLibraryLink: HTMLAnchorElement = fixture.nativeElement.querySelector(
      'a[href="/workflow/projectLibrary"]',
    );
    const projectMasterLink: HTMLAnchorElement = fixture.nativeElement.querySelector(
      'a[href="/admin/projects"]',
    );
    expect(projectLibraryLink.classList.contains('bg-sidebar-accent')).toBe(true);
    expect(projectMasterLink.classList.contains('bg-sidebar-accent')).toBe(false);
  });
});
