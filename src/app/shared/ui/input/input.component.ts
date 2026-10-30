import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-input',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputComponent), multi: true }],
  templateUrl: './input.component.html',
})
export class InputComponent implements ControlValueAccessor {
  readonly type       = input<string>('text');
  readonly styleClass = input<string>('');

  protected value = signal('');
  protected isDisabled = signal(false);
  protected onTouched = () => {};
  protected onChange  = (_: string) => {};

  protected readonly classes = computed(() =>
    cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      this.styleClass(),
    ),
  );

  writeValue(value: string): void        { this.value.set(value ?? ''); }
  registerOnChange(fn: (_: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void         { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void     { this.isDisabled.set(isDisabled); }

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }
}
