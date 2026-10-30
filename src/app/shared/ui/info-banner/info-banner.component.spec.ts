import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { InfoBannerComponent } from './info-banner.component';

@Component({
  standalone: true,
  imports: [InfoBannerComponent],
  template: `<ui-info-banner [title]="title" [message]="msg" [variant]="variant" />`,
})
class HostComponent {
  title   = 'Test Title';
  msg     = 'Test message';
  variant: 'info' | 'warning' = 'info';
}

describe('InfoBannerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders title and message', () => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-info-banner]') as HTMLElement;
    expect(el.textContent).toContain('Test Title');
    expect(el.textContent).toContain('Test message');
  });

  it('info variant applies blue border class', () => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-info-banner]') as HTMLElement;
    expect(el.className).toContain('--aepw-blue');
  });

  it('warning variant applies orange border class', () => {
    @Component({
      standalone: true,
      imports: [InfoBannerComponent],
      template: `<ui-info-banner [title]="title" [message]="msg" variant="warning" />`,
    })
    class WarningHostComponent {
      title = 'Test Title';
      msg   = 'Test message';
    }
    const warningFixture = TestBed.createComponent(WarningHostComponent);
    warningFixture.detectChanges();
    const el = warningFixture.nativeElement.querySelector('[data-info-banner]') as HTMLElement;
    expect(el.className).toContain('--aepw-orange');
  });

  it('info variant shows info icon name', () => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('lucide-icon') as HTMLElement;
    expect(icon).toBeDefined();
    // The icon element should have the name attribute or ng-reflect-name property
    // In Angular property bindings, ng-reflect-{property} is set for debugging
    expect(icon.outerHTML).toContain('lucide-icon');
    // Verify the computed property returns the right icon for info variant
    const infoComponent = fixture.debugElement.children[0].componentInstance;
    expect(infoComponent.iconName()).toBe('info');
  });
});
