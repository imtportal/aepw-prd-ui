import { Component, input } from '@angular/core';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-form-field',
  standalone: true,
  templateUrl: './form-field.component.html',
})
export class FormFieldComponent {
  readonly label      = input<string>('');
  readonly error      = input<string>('');
  readonly hint       = input<string>('');
  readonly required   = input<boolean>(false);
  readonly styleClass = input<string>('');
  protected cn = cn;
}
