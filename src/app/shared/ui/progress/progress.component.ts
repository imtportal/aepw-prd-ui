import { Component, computed, input } from '@angular/core';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-progress',
  standalone: true,
  templateUrl: './progress.component.html',
})
export class ProgressComponent {
  readonly value      = input<number>(0);
  readonly styleClass = input<string>('');

  readonly firstMilestonePercentage  = input<number>(33.33);
  readonly secondMilestonePercentage = input<number>(66.66);

  protected readonly clampedValue = computed(() => Math.max(0, Math.min(100, this.value())));
  protected readonly trackClasses = computed(() =>
    cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', this.styleClass()),
  );
}
