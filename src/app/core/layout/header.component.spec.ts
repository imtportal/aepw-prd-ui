import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { uiStore } from '../store/ui/ui.store';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentRef.setInput('pageTitle', 'Dashboard');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the page title', () => {
    expect(fixture.nativeElement.textContent).toContain('Dashboard');
  });

  it('toggles sidebarOpen on button click', () => {
    uiStore.sidebarOpen.set(true);
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(uiStore.sidebarOpen()).toBe(false);
  });
});
