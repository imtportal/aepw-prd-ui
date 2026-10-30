import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegionalMapComponent } from './regional-map.component';

describe('RegionalMapComponent', () => {
  let fixture: ComponentFixture<RegionalMapComponent>;
  let component: RegionalMapComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionalMapComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(RegionalMapComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('programs', []);
    fixture.detectChanges();
  });

  it('renders an SVG element', () => {
    expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
  });

  it('[data-region-id="indonesia"] circle is present', () => {
    expect(fixture.nativeElement.querySelector('[data-region-id="indonesia"]')).toBeTruthy();
  });

  it('clicking [data-region-id="indonesia"] emits programSelected with "indonesia"', () => {
    let emitted: string | undefined;
    component.programSelected.subscribe((id: string) => (emitted = id));
    const el = fixture.nativeElement.querySelector('[data-region-id="indonesia"]');
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(emitted).toBe('indonesia');
  });
});
