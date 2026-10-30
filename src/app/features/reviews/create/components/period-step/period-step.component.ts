import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from '../../../../../shared/ui/select/select.component';
import { REVIEW_PERIODS } from '../../create-review.types';

@Component({
  selector: 'app-period-step',
  standalone: true,
  imports: [FormsModule, SelectComponent],
  templateUrl: './period-step.component.html',
})
export class PeriodStepComponent {
  selectedPeriod = input<string>('');
  startDate      = input<string>('');
  endDate        = input<string>('');

  periodChange    = output<string>();
  startDateChange = output<string>();
  endDateChange   = output<string>();

  protected readonly periodOptions = REVIEW_PERIODS.map(p => ({ label: p, value: p }));
}
