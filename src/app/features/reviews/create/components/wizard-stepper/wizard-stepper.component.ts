import { Component, input } from '@angular/core';
import { WIZARD_STEPS } from '../../create-review.types';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  ChevronRight, CircleCheck,
} from 'lucide-angular';

@Component({
  selector: 'app-wizard-stepper',
  standalone: true,
  imports: [LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ ChevronRight, CircleCheck }) },
  ],
  templateUrl: './wizard-stepper.component.html',
})
export class WizardStepperComponent {
  currentStep = input.required<number>();
  steps       = input<{ label: string }[]>(WIZARD_STEPS);
}
