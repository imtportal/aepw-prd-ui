import { Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-toggle',
  standalone: true,
  templateUrl: './toggle.component.html',
})
export class ToggleComponent {
  checked       = input<boolean>(false);
  checkedChange = output<boolean>();
}
