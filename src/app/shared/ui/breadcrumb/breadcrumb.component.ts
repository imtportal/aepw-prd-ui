import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-breadcrumb',
  standalone: true,
  templateUrl: './breadcrumb.component.html',
})
export class BreadcrumbComponent {
  readonly styleClass = input<string>('');
  protected cn = cn;
}

@Component({
  selector: 'ui-breadcrumb-item',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumb-item.component.html',
})
export class BreadcrumbItemComponent {
  readonly label      = input.required<string>();
  readonly href       = input<string>('/');
  readonly current    = input<boolean>(false);
  /** Shows a separator arrow before this item. Set to false on the first item in a trail. */
  readonly separator  = input<boolean>(true);
  readonly styleClass = input<string>('');
  protected cn = cn;
}
