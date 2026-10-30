import { Component, computed, input } from '@angular/core';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default:     'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type AlertVariant = 'default' | 'destructive';

@Component({
  selector: 'ui-alert',
  standalone: true,
  templateUrl: './alert.component.html',
})
export class AlertComponent {
  readonly variant    = input<AlertVariant>('default');
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() => cn(alertVariants({ variant: this.variant() }), this.styleClass()));
}

@Component({
  selector: 'ui-alert-title',
  standalone: true,
  templateUrl: './alert-title.component.html',
})
export class AlertTitleComponent {
  readonly styleClass = input<string>('');
  protected cn = cn;
}

@Component({
  selector: 'ui-alert-description',
  standalone: true,
  templateUrl: './alert-description.component.html',
})
export class AlertDescriptionComponent {
  readonly styleClass = input<string>('');
  protected cn = cn;
}
