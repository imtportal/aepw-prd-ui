import { Component, computed, input } from '@angular/core';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-label',
  standalone: true,
  templateUrl: './label.component.html',
})
export class LabelComponent {
  readonly for        = input<string>('');
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() =>
    cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', this.styleClass()),
  );
}
