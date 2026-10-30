import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { LabelComponent } from './label.component';

@Component({
  standalone: true,
  imports: [LabelComponent],
  template: `<ui-label for="my-input">Name</ui-label>`,
})
class TestHostComponent {}

describe('LabelComponent', () => {
  it('renders label text', () => {
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label');
    expect(label.textContent).toContain('Name');
    expect(label.getAttribute('for')).toBe('my-input');
  });
});
