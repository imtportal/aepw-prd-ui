import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import {
  TableComponent, TableHeaderComponent, TableBodyComponent,
  TableRowComponent, TableHeadComponent, TableCellComponent,
  TableFooterComponent, TableCaptionComponent,
} from './table.component';

@Component({
  standalone: true,
  imports: [TableComponent, TableHeaderComponent, TableBodyComponent, TableRowComponent, TableHeadComponent, TableCellComponent, TableFooterComponent, TableCaptionComponent],
  template: `
    <ui-table>
      <ui-table-caption>Projects</ui-table-caption>
      <ui-table-header>
        <ui-table-row><ui-table-head>Name</ui-table-head></ui-table-row>
      </ui-table-header>
      <ui-table-body>
        <ui-table-row><ui-table-cell>Alpha</ui-table-cell></ui-table-row>
      </ui-table-body>
      <ui-table-footer>
        <ui-table-row><ui-table-cell>Total: 1</ui-table-cell></ui-table-row>
      </ui-table-footer>
    </ui-table>
  `,
})
class Host {}

describe('Table family', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('renders table structure', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    expect(el.querySelector('table')).toBeTruthy();
    expect(el.querySelector('thead')).toBeTruthy();
    expect(el.querySelector('tbody')).toBeTruthy();
    expect(el.querySelector('tfoot')).toBeTruthy();
    expect(el.querySelector('th')).toBeTruthy();
    expect(el.querySelector('td')).toBeTruthy();
    expect(el.querySelector('caption')).toBeTruthy();
  });

  it('renders cell content', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Alpha');
    expect(f.nativeElement.textContent).toContain('Name');
    expect(f.nativeElement.textContent).toContain('Projects');
  });

  it('th has font-medium text-muted-foreground', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.querySelector('th').className).toContain('text-muted-foreground');
  });

  it('tr has hover:bg-muted/50 class', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.querySelector('tr').className).toContain('hover:bg-muted/50');
  });
});
