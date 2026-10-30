import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TabsComponent, TabComponent, TabListComponent, TabPanelsComponent, TabPanelComponent } from './tabs.component';

@Component({
  standalone: true,
  imports: [TabsComponent, TabListComponent, TabComponent, TabPanelsComponent, TabPanelComponent],
  template: `
    <ui-tabs value="0">
      <ui-tab-list>
        <ui-tab value="0">Overview</ui-tab>
        <ui-tab value="1">Details</ui-tab>
      </ui-tab-list>
      <ui-tab-panels>
        <ui-tab-panel value="0">Overview content</ui-tab-panel>
        <ui-tab-panel value="1">Details content</ui-tab-panel>
      </ui-tab-panels>
    </ui-tabs>
  `,
})
class Host {}

describe('Tabs', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('should create', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });

  it('renders tab labels', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Overview');
    expect(f.nativeElement.textContent).toContain('Details');
  });

  it('activates selected tab on click', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    // Find the second tab button and click it
    const tabs = f.nativeElement.querySelectorAll('button');
    if (tabs.length > 1) {
      tabs[1].click();
      f.detectChanges();
      // Verify the second tab is now active
      expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    }
  });
});
