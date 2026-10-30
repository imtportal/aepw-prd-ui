import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AvatarComponent, AvatarFallbackComponent } from './avatar.component';

@Component({
  standalone: true,
  imports: [AvatarComponent, AvatarFallbackComponent],
  template: `<ui-avatar><ui-avatar-fallback>SC</ui-avatar-fallback></ui-avatar>`,
})
class Host {}

describe('Avatar', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('renders initials', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent.trim()).toContain('SC');
  });

  it('ui-avatar has rounded-full class', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const avatar = f.nativeElement.querySelector('ui-avatar > div');
    expect(avatar.className).toContain('rounded-full');
  });

  it('fallback has bg-muted class', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const fallback = f.nativeElement.querySelector('ui-avatar-fallback > div');
    expect(fallback.className).toContain('bg-muted');
  });
});

describe('AvatarComponent styleClass', () => {
  it('merges styleClass', async () => {
    @Component({
      standalone: true,
      imports: [AvatarComponent],
      template: `<ui-avatar styleClass="extra-av">X</ui-avatar>`,
    })
    class StyleHost {}
    await TestBed.configureTestingModule({ imports: [StyleHost] }).compileComponents();
    const f = TestBed.createComponent(StyleHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('ui-avatar > div').className).toContain('extra-av');
  });
});

describe('AvatarFallbackComponent styleClass', () => {
  it('merges styleClass', async () => {
    @Component({
      standalone: true,
      imports: [AvatarFallbackComponent],
      template: `<ui-avatar-fallback styleClass="extra-fb">X</ui-avatar-fallback>`,
    })
    class StyleHost {}
    await TestBed.configureTestingModule({ imports: [StyleHost] }).compileComponents();
    const f = TestBed.createComponent(StyleHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('ui-avatar-fallback > div').className).toContain('extra-fb');
  });
});
