import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TooltipDirective } from './tooltip.directive';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `<button uiTooltip="Save document">Save</button>`,
})
class Host {}

describe('TooltipDirective', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('creates the host', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });

  it('sets pTooltip attribute to the uiTooltip value', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.querySelector('button').getAttribute('pTooltip')).toBe('Save document');
  });

  it('sets tooltipPosition attribute to "top"', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.querySelector('button').getAttribute('tooltipPosition')).toBe('top');
  });
});
