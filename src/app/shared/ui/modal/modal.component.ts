import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'ui-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  heading  = input.required<string>();
  /** Optional Tailwind max-width class, e.g. 'max-w-2xl'. Defaults to 'max-w-2xl'. */
  maxWidth = input<string>('max-w-2xl');
  close    = output<void>();
}
