import { Component, input } from '@angular/core';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  PanelLeft,
} from 'lucide-angular';
import { uiStore } from '../store/ui/ui.store';

const HEADER_ICONS = { PanelLeft };

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(HEADER_ICONS) },
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly pageTitle = input.required<string>();
  protected readonly toggleSidebar = uiStore.toggleSidebar;
}
