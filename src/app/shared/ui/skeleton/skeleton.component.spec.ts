import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SkeletonComponent] }));

  it('has animate-pulse rounded-md bg-muted classes', () => {
    const f = TestBed.createComponent(SkeletonComponent);
    f.detectChanges();
    const el = f.nativeElement.querySelector('div');
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('rounded-md');
    expect(el.className).toContain('bg-muted');
  });

  it('merges styleClass', async () => {
    @Component({
      standalone: true,
      imports: [SkeletonComponent],
      template: `<ui-skeleton styleClass="w-48 h-4" />`,
    })
    class StyleHost {}
    await TestBed.configureTestingModule({ imports: [StyleHost] }).compileComponents();
    const f = TestBed.createComponent(StyleHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('div').className).toContain('w-48');
  });
});
