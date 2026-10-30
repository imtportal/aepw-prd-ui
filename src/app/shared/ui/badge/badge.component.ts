import { Component, computed, input } from '@angular/core';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:   'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline:     'text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

@Component({
  selector: 'ui-badge',
  standalone: true,
  templateUrl: './badge.component.html',
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('default');
  readonly styleClass = input<string>('');
  readonly backgroundColor = input<string | null>(null);
  protected readonly classes = computed(() =>
    cn(badgeVariants({ variant: this.variant() }), this.styleClass()),
  );
}
