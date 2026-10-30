import { Component, effect, ElementRef, input, viewChild } from '@angular/core';
import { service, factories, models } from 'powerbi-client';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, ChartBar,
} from 'lucide-angular';

@Component({
  selector: 'ui-power-bi-panel',
  standalone: true,
  imports: [LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ChartBar }) },
  ],
  templateUrl: './power-bi-panel.component.html',
})
export class PowerBiPanelComponent {
  title       = input.required<string>();
  embedConfig = input<models.IReportEmbedConfiguration | null>(null);

  private readonly embedContainer = viewChild<ElementRef<HTMLDivElement>>('embedContainer');
  private readonly pbiService = new service.Service(
    factories.hpmFactory,
    factories.wpmpFactory,
    factories.routerFactory,
  );

  constructor() {
    effect(() => {
      const config = this.embedConfig();
      const el     = this.embedContainer();
      if (!config || !el) return;
      try {
        this.pbiService.embed(el.nativeElement, config);
      } catch {
        // Not in a real Power BI context (tests, missing valid token)
      }
    });
  }
}
