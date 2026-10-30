import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-switch',
  standalone: true,
  imports: [ FormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SwitchComponent), multi: true }],
  templateUrl: './switch.component.html',
})
export class SwitchComponent implements ControlValueAccessor {
  readonly label      = input<string>('');
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
