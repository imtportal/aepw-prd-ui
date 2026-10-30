import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  it('should create', () => {
    @Component({
      standalone: true,
      imports: [BadgeComponent],
      template: `<ui-badge>Active</ui-badge>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders content', () => {
    @Component({
      standalone: true,
      imports: [BadgeComponent],
      template: `<ui-badge>Active</ui-badge>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Active');
  });

  it('applies default variant classes', () => {
    @Component({
      standalone: true,
      imports: [BadgeComponent],
      template: `<ui-badge>Active</ui-badge>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span');
    expect(el.className).toContain('bg-primary');
    expect(el.className).toContain('text-primary-foreground');
  });

  it('applies secondary variant classes', () => {
    @Component({
      standalone: true,
      imports: [BadgeComponent],
      template: `<ui-badge variant="secondary">Secondary</ui-badge>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').className).toContain('bg-secondary');
  });

  it('applies destructive variant classes', () => {
    @Component({
      standalone: true,
      imports: [BadgeComponent],
      template: `<ui-badge variant="destructive">Destructive</ui-badge>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').className).toContain('bg-destructive');
  });

  it('applies outline variant classes', () => {
    @Component({
      standalone: true,
      imports: [BadgeComponent],
      template: `<ui-badge variant="outline">Outline</ui-badge>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').className).toContain('text-foreground');
  });
});

describe('BadgeComponent styleClass', () => {
  it('merges styleClass into class', async () => {
    @Component({
      standalone: true,
      imports: [BadgeComponent],
      template: `<ui-badge styleClass="my-custom">X</ui-badge>`,
    })
    class StyleHost {}

    await TestBed.configureTestingModule({ imports: [StyleHost] }).compileComponents();
    const f = TestBed.createComponent(StyleHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('span').className).toContain('my-custom');
  });
});
