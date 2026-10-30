import { Component, computed, inject, InjectionToken, input, signal } from '@angular/core';
import { cn } from '../../utils/cn';

export const ACCORDION_PANEL_CTX = new InjectionToken<AccordionPanelComponent>('AccordionPanelCtx');

@Component({
  selector: 'ui-accordion',
  standalone: true,
  templateUrl: './accordion-root.component.html',
})
export class AccordionComponent {
  readonly multiple   = input<boolean>(false);
  readonly styleClass = input<string>('');

  private openValues = signal<(string | number)[]>([]);

  protected cn = cn;

  isOpen(value: string | number): boolean {
    return this.openValues().includes(value);
  }

  toggle(value: string | number): void {
    if (this.multiple()) {
      this.openValues.update(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      );
    } else {
      this.openValues.set(this.openValues().includes(value) ? [] : [value]);
    }
  }
}

@Component({
  selector: 'ui-accordion-panel',
  standalone: true,
  providers: [{ provide: ACCORDION_PANEL_CTX, useExisting: AccordionPanelComponent }],
  templateUrl: './accordion-panel.component.html',
})
export class AccordionPanelComponent {
  readonly value      = input<string | number>('');
  readonly styleClass = input<string>('');

  protected cn = cn;

  private accordion = inject(AccordionComponent, { optional: true });

  readonly isOpen = computed(() => this.accordion?.isOpen(this.value()) ?? false);

  toggle(): void { this.accordion?.toggle(this.value()); }
}

@Component({
  selector: 'ui-accordion-header',
  standalone: true,
  templateUrl: './accordion.component.html',
})
export class AccordionHeaderComponent {
  readonly styleClass = input<string>('');
  readonly panel = inject(ACCORDION_PANEL_CTX);
  protected cn = cn;
}

@Component({
  selector: 'ui-accordion-content',
  standalone: true,
  templateUrl: './accordion-content.component.html',
})
export class AccordionContentComponent {
  readonly styleClass = input<string>('');
  readonly panel = inject(ACCORDION_PANEL_CTX);
  protected cn = cn;
}
