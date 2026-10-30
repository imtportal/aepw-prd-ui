import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-textarea',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextareaComponent), multi: true }],
  templateUrl: './textarea.component.html',
})
export class TextareaComponent implements ControlValueAccessor {
  readonly rows       = input<number>(3);
  readonly styleClass = input<string>('');

  protected value = signal('');
  protected isDisabled = signal(false);
  protected onTouched = () => {};
  protected onChange  = (_: string) => {};

  protected readonly classes = computed(() =>
    cn(
      'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      this.styleClass(),
    ),
  );

  writeValue(value: string): void        { this.value.set(value ?? ''); }
  registerOnChange(fn: (_: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void         { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void     { this.isDisabled.set(isDisabled); }

  protected onInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.value.set(val);
    this.onChange(val);
  }
}
