import { Component, computed, input } from '@angular/core';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  templateUrl: './avatar.component.html',
})
export class AvatarComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() =>
    cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', this.styleClass()),
  );
}

@Component({
  selector: 'ui-avatar-fallback',
  standalone: true,
  templateUrl: './avatar.component.html',
})
export class AvatarFallbackComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() =>
    cn('flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-semibold', this.styleClass()),
  );
}
