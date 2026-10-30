import { Component, computed, input, model } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-sheet',
  standalone: true,
  imports: [DrawerModule],
  templateUrl: './sheet.component.html',
})
export class SheetComponent {
  readonly visible    = model<boolean>(false);
  readonly header     = input<string>('');
  readonly position   = input<'left' | 'right' | 'top' | 'bottom'>('right');
  readonly styleClass = input<string>('');
  readonly width      = input<string>('');

  protected readonly drawerClass = computed(() => cn('w-80', this.styleClass()));

  // Inline style wins over PrimeNG's .p-drawer-right CSS width
  protected readonly panelStyle = computed(() =>
    this.width() ? { width: this.width() } : null
  );
}
