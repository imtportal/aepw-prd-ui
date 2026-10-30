import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ToggleComponent } from './toggle.component';

@Component({
  standalone: true,
  imports: [ToggleComponent],
  template: `<ui-toggle [checked]="val()" (checkedChange)="val.set($event)" />`,
})
class HostComponent { val = signal(false); }

describe('ToggleComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host    = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('checkbox is unchecked when checked=false', () => {
    const cb = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(cb.checked).toBe(false);
  });

  it('checkbox is checked when checked=true', () => {
    host.val.set(true);
    fixture.detectChanges();
    const cb = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it('emits checkedChange true when checkbox changes to checked', () => {
    const cb = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(host.val()).toBe(true);
  });

  it('renders data-toggle-track and data-toggle-thumb', () => {
    expect(fixture.nativeElement.querySelector('[data-toggle-track]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-toggle-thumb]')).not.toBeNull();
  });
});
