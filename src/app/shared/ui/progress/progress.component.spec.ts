import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ProgressComponent } from './progress.component';

@Component({ standalone: true, imports: [ProgressComponent], template: `<ui-progress [value]="v" />` })
class Host { v = 40; }

describe('ProgressComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('sets inner bar width to value%', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    // Inner bar is the second div (the progress bar itself)
    const innerBar = f.nativeElement.querySelectorAll('div')[1];
    expect(innerBar.getAttribute('style')).toContain('40%');
  });

  it('clamps value below 0 to 0%', () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.v = -10;
    f.detectChanges();
    const innerBar = f.nativeElement.querySelectorAll('div')[1];
    expect(innerBar.getAttribute('style')).toContain('0%');
  });

  it('clamps value above 100 to 100%', () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.v = 150;
    f.detectChanges();
    const innerBar = f.nativeElement.querySelectorAll('div')[1];
    expect(innerBar.getAttribute('style')).toContain('100%');
  });

  it('track has bg-secondary class', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const track = f.nativeElement.querySelector('ui-progress > div');
    expect(track.className).toContain('bg-secondary');
  });

  it('merges styleClass on track', async () => {
    @Component({
      standalone: true,
      imports: [ProgressComponent],
      template: `<ui-progress [value]="50" styleClass="my-progress" />`,
    })
    class StyleHost {}
    await TestBed.configureTestingModule({ imports: [StyleHost] }).compileComponents();
    const f = TestBed.createComponent(StyleHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('ui-progress > div').className).toContain('my-progress');
  });
});
