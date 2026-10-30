import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  it('should create', () => {
    @Component({
      standalone: true,
      imports: [ButtonComponent],
      template: `<ui-button>Click</ui-button>`,
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
      imports: [ButtonComponent],
      template: `<ui-button>Click</ui-button>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Click');
  });

  it('applies default variant', () => {
    @Component({
      standalone: true,
      imports: [ButtonComponent],
      template: `<ui-button>Click</ui-button>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').className).toContain('bg-primary');
  });

  it('applies outline variant', () => {
    @Component({
      standalone: true,
      imports: [ButtonComponent],
      template: `<ui-button variant="outline">Click</ui-button>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').className).toContain('border-input');
  });

  it('applies sm size', () => {
    @Component({
      standalone: true,
      imports: [ButtonComponent],
      template: `<ui-button size="sm">Click</ui-button>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').className).toContain('h-9');
  });

  it('disables the button', () => {
    @Component({
      standalone: true,
      imports: [ButtonComponent],
      template: `<ui-button [disabled]="true">Click</ui-button>`,
    })
    class TestHostComponent {}

    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
  });
});

describe('ButtonComponent styleClass', () => {
  it('merges styleClass into class', async () => {
    @Component({
      standalone: true,
      imports: [ButtonComponent],
      template: `<ui-button styleClass="my-btn-custom">Y</ui-button>`,
    })
    class StyleHost {}

    await TestBed.configureTestingModule({ imports: [StyleHost] }).compileComponents();
    const f = TestBed.createComponent(StyleHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('button').className).toContain('my-btn-custom');
  });
});
