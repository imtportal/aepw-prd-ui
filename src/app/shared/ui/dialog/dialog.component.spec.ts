import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { DialogComponent } from './dialog.component';

@Component({
  standalone: true,
  imports: [DialogComponent],
  template: `<ui-dialog [(visible)]="open" header="Test Dialog">Content</ui-dialog>`,
})
class Host { open = false; }

describe('DialogComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('should create', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });

  it('has ui-dialog element in DOM', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.querySelector('ui-dialog')).toBeTruthy();
  });
});
