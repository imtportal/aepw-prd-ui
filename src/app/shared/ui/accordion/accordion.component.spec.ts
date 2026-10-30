import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import {
  AccordionComponent,
  AccordionPanelComponent,
  AccordionHeaderComponent,
  AccordionContentComponent,
} from './accordion.component';

@Component({
  standalone: true,
  imports: [AccordionComponent, AccordionPanelComponent, AccordionHeaderComponent, AccordionContentComponent],
  template: `
    <ui-accordion>
      <ui-accordion-panel value="item-1">
        <ui-accordion-header>Panel 1</ui-accordion-header>
        <ui-accordion-content>Content 1</ui-accordion-content>
      </ui-accordion-panel>
      <ui-accordion-panel value="item-2">
        <ui-accordion-header>Panel 2</ui-accordion-header>
        <ui-accordion-content>Content 2</ui-accordion-content>
      </ui-accordion-panel>
    </ui-accordion>
  `,
})
class Host {}

describe('Accordion', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('should create', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });

  it('renders accordion headers', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Panel 1');
    expect(f.nativeElement.textContent).toContain('Panel 2');
  });

  it('content is hidden by default', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent).not.toContain('Content 1');
  });

  it('clicking header reveals content', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const button = f.nativeElement.querySelector('ui-accordion-panel button');
    button.click();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Content 1');
  });
});
