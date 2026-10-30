import { Component, computed, input } from '@angular/core';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-separator',
  standalone: true,
  templateUrl: './separator.component.html',
})
export class SeparatorComponent {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly styleClass  = input<string>('');
  protected readonly classes = computed(() =>
    cn(
      'shrink-0 bg-border',
      this.orientation() === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      this.styleClass(),
    ),
  );
}
