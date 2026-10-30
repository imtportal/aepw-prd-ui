import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItemComponent } from './breadcrumb.component';

@Component({
  standalone: true,
  imports: [BreadcrumbComponent, BreadcrumbItemComponent],
  template: `
    <ui-breadcrumb>
      <ui-breadcrumb-item label="Home" href="/home" />
      <ui-breadcrumb-item label="Reporting" [current]="true" />
    </ui-breadcrumb>
  `,
})
class Host {}

describe('Breadcrumb', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host], providers: [provideRouter([])] }));

  it('renders item labels', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Home');
    expect(f.nativeElement.textContent).toContain('Reporting');
  });

  it('current item has aria-current="page"', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const items = f.nativeElement.querySelectorAll('[aria-current]');
    expect(items.length).toBe(1);
    expect(items[0].getAttribute('aria-current')).toBe('page');
  });

  it('non-current item is an anchor with routerLink', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const anchor = f.nativeElement.querySelector('a');
    expect(anchor).toBeTruthy();
    // routerLink renders as href with the path
    expect(anchor.getAttribute('href')).toBe('/home');
  });
});
