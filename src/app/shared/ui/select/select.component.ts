import { CommonModule, JsonPipe } from '@angular/common';
import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule, FormsModule, JsonPipe],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true },
  ],
  templateUrl: './select.component.html',
})
export class SelectComponent implements ControlValueAccessor {
  // readonly options = input<Record<string, unknown>[]>([]);
  readonly options = input<object[]>([]);
  readonly optionLabel = input<string>('label');
  readonly optionValue = input<string>('value');
  readonly placeholder = input<string>('');
  readonly styleClass = input<string>('');

  protected value: unknown = '';
  protected isDisabled = false;
  protected onChange = (_: unknown) => {};
  protected onTouched = () => {};

  protected onValueChange(val: unknown): void {
    this.value = val;
    this.onChange(val);
  }
  protected getOptionValue(option: object): unknown {
    return (option as Record<string, unknown>)[this.optionValue()];
  }

  protected getOptionLabel(option: object): unknown {
    return (option as Record<string, unknown>)[this.optionLabel()];
  }
  writeValue(val: unknown): void {
    this.value = val;
  }
  registerOnChange(fn: (_: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
