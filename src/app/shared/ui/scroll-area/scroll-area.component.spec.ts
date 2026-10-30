import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ScrollAreaComponent } from './scroll-area.component';

describe('ScrollAreaComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ScrollAreaComponent] }));

  it('has overflow-auto class', () => {
    const f = TestBed.createComponent(ScrollAreaComponent);
    f.detectChanges();
    const el = f.nativeElement.querySelector('div');
    expect(el.className).toContain('overflow-auto');
  });

  it('has all scrollbar utility classes', () => {
    const f = TestBed.createComponent(ScrollAreaComponent);
    f.detectChanges();
    const el = f.nativeElement.querySelector('div');
    expect(el.className).toContain('scrollbar-thin');
    expect(el.className).toContain('scrollbar-thumb-border');
    expect(el.className).toContain('scrollbar-track-transparent');
  });

  it('projects content', () => {
    @Component({
      standalone: true,
      imports: [ScrollAreaComponent],
      template: `<ui-scroll-area><span>Inner</span></ui-scroll-area>`,
    })
    class Wrapper {}
    TestBed.configureTestingModule({ imports: [Wrapper] });
    const f = TestBed.createComponent(Wrapper);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Inner');
  });

  it('merges styleClass', async () => {
    @Component({
      standalone: true,
      imports: [ScrollAreaComponent],
      template: `<ui-scroll-area styleClass="h-64">Content</ui-scroll-area>`,
    })
    class StyleHost {}
    await TestBed.configureTestingModule({ imports: [StyleHost] }).compileComponents();
    const f = TestBed.createComponent(StyleHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('ui-scroll-area > div').className).toContain('h-64');
  });
});
