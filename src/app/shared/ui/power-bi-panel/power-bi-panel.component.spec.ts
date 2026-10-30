import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PowerBiPanelComponent } from './power-bi-panel.component';
import { models } from 'powerbi-client';

const MOCK_CONFIG: models.IReportEmbedConfiguration = {
  type: 'report',
  id: 'fake-id',
  embedUrl: 'https://fake.powerbi.com',
  accessToken: 'fake-token',
  tokenType: models.TokenType.Embed,
};

describe('PowerBiPanelComponent', () => {
  let fixture: ComponentFixture<PowerBiPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PowerBiPanelComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PowerBiPanelComponent);
    fixture.componentRef.setInput('title', 'Test Panel');
    fixture.detectChanges();
  });

  it('shows data-pbi-placeholder when embedConfig is null', () => {
    expect(fixture.nativeElement.querySelector('[data-pbi-placeholder]')).toBeTruthy();
  });

  it('hides data-pbi-placeholder when embedConfig is provided', () => {
    fixture.componentRef.setInput('embedConfig', MOCK_CONFIG);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-pbi-placeholder]')).toBeFalsy();
  });

  it('shows data-pbi-embed when embedConfig is provided', () => {
    fixture.componentRef.setInput('embedConfig', MOCK_CONFIG);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-pbi-embed]')).toBeTruthy();
  });

  it('placeholder paragraph reads "Power BI report · Connect when ready"', () => {
    const p = fixture.nativeElement.querySelector('[data-pbi-placeholder] p');
    expect(p?.textContent?.trim()).toBe('Power BI report · Connect when ready');
  });
});
