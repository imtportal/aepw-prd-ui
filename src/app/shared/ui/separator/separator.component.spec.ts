import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SeparatorComponent } from './separator.component';

@Component({ standalone: true, imports: [SeparatorComponent], template: `<ui-separator [orientation]="o" />` })
class Host { o: 'horizontal' | 'vertical' = 'horizontal'; }

describe('SeparatorComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('renders horizontal by default (h-[1px] w-full)', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('[role=separator]');
    expect(el.className).toContain('h-[1px]');
    expect(el.className).toContain('w-full');
    expect(el.className).toContain('bg-border');
  });

  it('renders vertical (h-full w-[1px])', () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.o = 'vertical';
    f.detectChanges();
    const el = f.nativeElement.querySelector('[role=separator]');
    expect(el.className).toContain('h-full');
    expect(el.className).toContain('w-[1px]');
  });

  it('merges styleClass', async () => {
    @Component({
      standalone: true,
      imports: [SeparatorComponent],
      template: `<ui-separator styleClass="my-sep" />`,
    })
    class StyleHost {}
    await TestBed.configureTestingModule({ imports: [StyleHost] }).compileComponents();
    const f = TestBed.createComponent(StyleHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role=separator]').className).toContain('my-sep');
  });
});
