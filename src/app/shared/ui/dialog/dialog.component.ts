import { Component, computed, input, model, output } from '@angular/core';

import { DialogModule } from 'primeng/dialog';

import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-dialog',
  standalone: true,
  imports: [DialogModule],
  templateUrl: './dialog.component.html',
})
export class DialogComponent {
  readonly visible = model<boolean>(false);

  readonly header = input<string>('');
  readonly styleClass = input<string>('');

  readonly closed = output<void>();

  protected readonly dialogClass = computed(() => cn('w-full max-w-lg', this.styleClass()));

  protected onDialogHide(): void {
    this.closed.emit();
  }
}
