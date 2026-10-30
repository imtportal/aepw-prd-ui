import { Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-search-input',
  standalone: true,
  templateUrl: './search-input.component.html',
})
export class SearchInputComponent {
  value       = input('');
  placeholder = input('Search...');
  styleClass  = input('');
  inputClass  = input('h-9 text-sm');

  valueChange = output<string>();

  protected onInput(e: Event): void {
    this.valueChange.emit((e.target as HTMLInputElement).value);
  }
}
