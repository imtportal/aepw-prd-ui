import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextareaComponent } from './textarea.component';

@Component({
  standalone: true,
  imports: [TextareaComponent, ReactiveFormsModule],
  template: `<ui-textarea [formControl]="ctrl" />`,
})
class TestHostComponent {
  ctrl = new FormControl('initial');
}

describe('TextareaComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create', () => expect(fixture.componentInstance).toBeTruthy());
  it('renders native textarea', () => expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy());
  it('reflects formControl value', () => expect(fixture.nativeElement.querySelector('textarea').value).toBe('initial'));
  it('updates formControl on input', () => {
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    ta.value = 'changed';
    ta.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.ctrl.value).toBe('changed');
  });

  it('disables textarea when control is disabled', () => {
    fixture.componentInstance.ctrl.disable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea').disabled).toBe(true);
  });
});
