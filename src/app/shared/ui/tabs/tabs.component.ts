import {
  Component,
  InjectionToken,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { cn } from '../../utils/cn';

/** Token used to pass the TabsComponent context to child tab components. */
export const TABS_CTX = new InjectionToken<TabsComponent>('TABS_CTX');

@Component({
  selector: 'ui-tabs',
  standalone: true,
  imports: [],
  providers: [{ provide: TABS_CTX, useExisting: TabsComponent }],
  templateUrl: './tabs-wrapper.component.html',
  host: { class: 'block' },
})
export class TabsComponent {
  readonly value = model<string | number>('0');

  isActive(val: string | number): boolean {
    return String(this.value()) === String(val);
  }

  activate(val: string | number): void {
    this.value.set(val);
  }
}

@Component({
  selector: 'ui-tab-list',
  standalone: true,
  imports: [],
  templateUrl: './tabs.component.html',
})
export class TabListComponent {}

@Component({
  selector: 'ui-tab',
  standalone: true,
  imports: [],
  templateUrl: './tab-item.component.html',
})
export class TabComponent {
  readonly value      = input.required<string | number>();
  readonly styleClass = input<string>('');

  protected tabs = inject(TABS_CTX);
  protected cn   = cn;

  protected readonly active = computed(() => this.tabs.isActive(this.value()));

  protected readonly tabClass = computed(() =>
    cn(
      this.active()
        ? 'border-b-2 border-primary text-primary font-medium transition-colors'
        : 'text-muted-foreground hover:text-foreground transition-colors',
      this.styleClass()
    )
  );
}

@Component({
  selector: 'ui-tab-panels',
  standalone: true,
  imports: [],
  templateUrl: './tab.component.html',
})
export class TabPanelsComponent {}

@Component({
  selector: 'ui-tab-panel',
  standalone: true,
  imports: [],
  templateUrl: './tab-panels.component.html',
})
export class TabPanelComponent {
  readonly value = input.required<string | number>();

  protected tabs = inject(TABS_CTX);
}
