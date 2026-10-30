import { Component, input, output } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, X,
} from 'lucide-angular';
import { ActiveFilter, ActiveFilterKey } from '../../dashboard.types';

@Component({
  selector: 'app-active-filters',
  standalone: true,
  imports: [LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ X }) },
  ],
  templateUrl: './active-filters.component.html',
})
export class ActiveFiltersComponent {
  filters  = input.required<ActiveFilter[]>();
  clear    = output<ActiveFilterKey>();
  clearAll = output<void>();
}
