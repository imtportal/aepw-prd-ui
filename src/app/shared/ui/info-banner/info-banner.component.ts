import { Component, computed, input } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  Info, TriangleAlert,
} from 'lucide-angular';

@Component({
  selector: 'ui-info-banner',
  standalone: true,
  imports: [LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Info, TriangleAlert }) },
  ],
  templateUrl: './info-banner.component.html',
})
export class InfoBannerComponent {
  title   = input.required<string>();
  message = input.required<string>();
  variant = input<'info' | 'warning'>('info');

  protected readonly bannerClass = computed(() =>
    this.variant() === 'warning'
      ? 'flex items-start gap-3 rounded-md border border-[hsl(var(--aepw-orange)/0.3)] bg-[hsl(var(--aepw-orange)/0.04)] px-4 py-3 text-[hsl(var(--aepw-orange))]'
      : 'flex items-start gap-3 rounded-md border border-[hsl(var(--aepw-blue)/0.3)] bg-[hsl(var(--aepw-blue)/0.04)] px-4 py-3 text-[hsl(var(--aepw-blue))]'
  );

  protected readonly iconName = computed(() =>
    this.variant() === 'warning' ? 'triangle-alert' : 'info'
  );
}
