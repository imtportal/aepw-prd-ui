import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from './input.component';

@Component({
  standalone: true,
  imports: [InputComponent, ReactiveFormsModule],
  template: `<ui-input [formControl]="ctrl" type="text" />`,
})
class TestHostComponent {
  ctrl = new FormControl('hello');
}

describe('InputComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create', () => expect(fixture.componentInstance).toBeTruthy());

  it('renders native input element', () => {
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
  });

  it('reflects formControl value', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('hello');
  });

  it('updates formControl on user input', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'world';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.ctrl.value).toBe('world');
  });

  it('disables input when control is disabled', () => {
    fixture.componentInstance.ctrl.disable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input').disabled).toBe(true);
  });

  it('has Tailwind border class', () => {
    expect(fixture.nativeElement.querySelector('input').className).toContain('border-input');
  });
});
