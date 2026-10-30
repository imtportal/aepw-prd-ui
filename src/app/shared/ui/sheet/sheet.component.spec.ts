import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SheetComponent } from './sheet.component';

@Component({
  standalone: true,
  imports: [SheetComponent],
  template: `<ui-sheet [(visible)]="open" header="Details" position="right">Body</ui-sheet>`,
})
class Host { open = false; }

describe('SheetComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('should create', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });

  it('has ui-sheet element in DOM', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.querySelector('ui-sheet')).toBeTruthy();
  });
});
