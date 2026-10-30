import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
} from './card.component';

@Component({
  standalone: true,
  imports: [CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent],
  template: `
    <ui-card>
      <ui-card-header>
        <ui-card-title>Title</ui-card-title>
        <ui-card-description>Desc</ui-card-description>
      </ui-card-header>
      <ui-card-content>Body</ui-card-content>
      <ui-card-footer>Footer</ui-card-footer>
    </ui-card>
  `,
})
class TestHostComponent {}

describe('Card family', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
  });

  it('renders all sub-components', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Title');
    expect(el.textContent).toContain('Desc');
    expect(el.textContent).toContain('Body');
    expect(el.textContent).toContain('Footer');
  });

  it('ui-card root div has rounded-lg border bg-card classes', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    // Use specific selector to avoid ambiguity with nested divs
    const cardEl = fixture.nativeElement.querySelector('ui-card > div');
    expect(cardEl.className).toContain('rounded-lg');
    expect(cardEl.className).toContain('border');
    expect(cardEl.className).toContain('bg-card');
  });

  it('ui-card-title renders as h3', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h3')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('h3').textContent).toContain('Title');
  });

  it('ui-card-description renders as p', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('p')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('p').textContent).toContain('Desc');
  });
});

describe('CardComponent styleClass', () => {
  it('merges styleClass into class', async () => {
    @Component({
      standalone: true,
      imports: [CardComponent],
      template: `<ui-card styleClass="extra-class">Content</ui-card>`,
    })
    class StyleHost {}

    await TestBed.configureTestingModule({ imports: [StyleHost] }).compileComponents();
    const f = TestBed.createComponent(StyleHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('ui-card > div').className).toContain('extra-class');
  });
});
