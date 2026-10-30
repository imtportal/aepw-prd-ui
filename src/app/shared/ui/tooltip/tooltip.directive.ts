import { Directive, input } from '@angular/core';

@Directive({
  selector: '[uiTooltip]',
  standalone: true,
  host: {
    '[attr.pTooltip]':        'text()',
    '[attr.tooltipPosition]': '"top"',
  },
})
export class TooltipDirective {
  readonly text = input<string>('', { alias: 'uiTooltip' });
}
