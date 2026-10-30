import { Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-include-exclude-toggle',
  standalone: true,
  templateUrl: './include-exclude-toggle.component.html',
})
export class IncludeExcludeToggleComponent {
  included       = input<boolean>(false);
  includedChange = output<boolean>();
}
