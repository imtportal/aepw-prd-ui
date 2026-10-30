import { Component, forwardRef, inject, InjectionToken, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';
import { cn } from '../../utils/cn';

/** Token so RadioItemComponent can read / write the group's value. */
export const RADIO_GROUP = new InjectionToken<RadioGroupComponent>('RadioGroupComponent');

@Component({
  selector: 'ui-radio-group',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RadioGroupComponent), multi: true },
    { provide: RADIO_GROUP, useExisting: forwardRef(() => RadioGroupComponent) },
  ],
  templateUrl: './radio-group.component.html',
})
export class RadioGroupComponent implements ControlValueAccessor {
  readonly styleClass  = input<string>('');
  readonly groupValue  = signal<any>(null);
  readonly isDisabled  = signal(false);

  protected cn       = cn;
  protected onChange = (_: any) => {};
  protected onTouched = () => {};

  writeValue(val: any): void                { this.groupValue.set(val); }
  registerOnChange(fn: (_: any) => void)    { this.onChange = fn; }
  registerOnTouched(fn: () => void)         { this.onTouched = fn; }
  setDisabledState(d: boolean)              { this.isDisabled.set(d); }

  selectValue(val: any): void {
    this.groupValue.set(val);
    this.onChange(val);
    this.onTouched();
  }
}

@Component({
  selector: 'ui-radio-item',
  standalone: true,
  imports: [RadioButtonModule, FormsModule],
  templateUrl: './radio-item.component.html',
})
export class RadioItemComponent {
  private static _counter = 0;

  readonly group      = inject(RADIO_GROUP);
  readonly value      = input.required<any>();
  readonly label      = input<string>('');
  readonly inputId    = input<string>('radio-' + RadioItemComponent._counter++);
  readonly styleClass = input<string>('');

  protected cn = cn;
}
