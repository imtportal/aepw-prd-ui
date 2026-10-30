import { Component, computed, input } from '@angular/core';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
})
export class SkeletonComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() =>
    cn('animate-pulse rounded-md bg-muted', this.styleClass()),
  );
}
