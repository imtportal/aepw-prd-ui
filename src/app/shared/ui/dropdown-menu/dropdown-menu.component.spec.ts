import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownMenuComponent } from './dropdown-menu.component';

@Component({
  selector: 'app-test',
  template: `
    <ui-dropdown-menu>
      <button dropdownTrigger>Open Menu</button>
      <div dropdownContent>Menu Content</div>
    </ui-dropdown-menu>
  `,
  standalone: true,
  imports: [DropdownMenuComponent],
})
class TestComponent {}

describe('DropdownMenuComponent', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: DropdownMenuComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  it('hides menu by default', () => {
    expect(fixture.nativeElement.querySelector('[data-dropdown-menu]')).toBeNull();
  });

  it('shows menu after trigger div is clicked', () => {
    const triggerWrap = fixture.nativeElement.querySelector('div > div:first-child') as HTMLElement;
    triggerWrap.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-dropdown-menu]')).not.toBeNull();
  });

  it('hides menu on document click', () => {
    component.isOpen.set(true);
    fixture.detectChanges();
    document.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-dropdown-menu]')).toBeNull();
  });

  it('toggles closed when trigger clicked while open', () => {
    component.isOpen.set(true);
    fixture.detectChanges();
    const triggerWrap = fixture.nativeElement.querySelector('div > div:first-child') as HTMLElement;
    triggerWrap.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);
  });

  it('trigger click does not immediately close menu via document listener (stopPropagation)', () => {
    const triggerWrap = fixture.nativeElement.querySelector('div > div:first-child') as HTMLElement;
    triggerWrap.click();
    fixture.detectChanges();
    // Menu should be open — stopPropagation prevented the HostListener from re-closing it
    expect(component.isOpen()).toBe(true);
  });
});
