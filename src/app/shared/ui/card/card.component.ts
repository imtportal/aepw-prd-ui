import { Component, computed, input } from '@angular/core';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-card',
  standalone: true,
  templateUrl: './card.component.html',
})
export class CardComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() =>
    cn('rounded-lg border bg-card text-card-foreground shadow-sm', this.styleClass()),
  );
}

@Component({
  selector: 'ui-card-header',
  standalone: true,
  templateUrl: './card.component.html',
})
export class CardHeaderComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() => cn('flex flex-col space-y-1.5 p-6', this.styleClass()));
}

@Component({
  selector: 'ui-card-title',
  standalone: true,
  templateUrl: './card.component.html',
})
export class CardTitleComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() =>
    cn('text-2xl font-semibold leading-none tracking-tight', this.styleClass()),
  );
}

@Component({
  selector: 'ui-card-description',
  standalone: true,
  templateUrl: './card-header.component.html',
})
export class CardDescriptionComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() => cn('text-sm text-muted-foreground', this.styleClass()));
}

@Component({
  selector: 'ui-card-content',
  standalone: true,
  templateUrl: './card-title.component.html',
})
export class CardContentComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() => cn('p-6 pt-0', this.styleClass()));
}

@Component({
  selector: 'ui-card-footer',
  standalone: true,
  templateUrl: './card-description.component.html',
})
export class CardFooterComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() => cn('flex items-center p-6 pt-0', this.styleClass()));
}
