import { TestBed } from '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ChartComponent } from './chart.component';

@Component({
  standalone: true,
  imports: [ChartComponent],
  template: `<ui-chart type="bar" [data]="d" height="200px" />`,
})
class Host {
  d = { labels: ['Jan', 'Feb'], datasets: [{ label: 'Score', data: [10, 20] }] };
}

describe('ChartComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [Host],
    schemas: [NO_ERRORS_SCHEMA],
  }));
  it('should create', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });
});
