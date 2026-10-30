import { Component, computed, input } from '@angular/core';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-scroll-area',
  standalone: true,
  templateUrl: './scroll-area.component.html',
})
export class ScrollAreaComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() =>
    cn('overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent', this.styleClass()),
  );
}
