import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AlertComponent, AlertTitleComponent, AlertDescriptionComponent } from './alert.component';

@Component({
  standalone: true,
  imports: [AlertComponent, AlertTitleComponent, AlertDescriptionComponent],
  template: `<ui-alert [variant]="v"><ui-alert-title>Oops</ui-alert-title><ui-alert-description>Something went wrong</ui-alert-description></ui-alert>`,
})
class Host { v: 'default' | 'destructive' = 'default'; }

describe('Alert', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('renders title and description', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Oops');
    expect(f.nativeElement.textContent).toContain('Something went wrong');
  });

  it('applies default variant (bg-background)', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role=alert]').className).toContain('bg-background');
  });

  it('applies destructive variant (text-destructive)', () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.v = 'destructive';
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role=alert]').className).toContain('text-destructive');
  });
});

describe('AlertComponent styleClass', () => {
  it('merges styleClass', async () => {
    @Component({
      standalone: true,
      imports: [AlertComponent],
      template: `<ui-alert styleClass="custom-alert">Content</ui-alert>`,
    })
    class StyleHost {}
    await TestBed.configureTestingModule({ imports: [StyleHost] }).compileComponents();
    const f = TestBed.createComponent(StyleHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role=alert]').className).toContain('custom-alert');
  });
});
