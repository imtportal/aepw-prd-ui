import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  imports: [CheckboxModule, FormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxComponent), multi: true }],
  templateUrl: './checkbox.component.html',
})
export class CheckboxComponent implements ControlValueAccessor {
  private static _counter = 0;

  readonly label      = input<string>('');
  readonly inputId    = input<string>('checkbox-' + CheckboxComponent._counter++);
  readonly styleClass = input<string>('');

  protected cn = cn;
  protected checked    = false;
  protected isDisabled = false;
  protected onChange   = (_: boolean) => {};
  protected onTouched  = () => {};

  writeValue(val: boolean): void                   { this.checked = !!val; }
  registerOnChange(fn: (_: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void          { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void      { this.isDisabled = isDisabled; }
  protected onCheckedChange(val: boolean): void    { this.checked = val; this.onChange(val); this.onTouched(); }
}
