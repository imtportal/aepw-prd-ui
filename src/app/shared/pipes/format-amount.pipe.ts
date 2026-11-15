import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatAmount',
  standalone: true,
})
export class FormatAmountPipe implements PipeTransform {
  transform(value: number | string | null | undefined, eliminateDecimals: boolean = false): string {
    if (String(value) == "" || value == undefined || value == null) {
      return "";
    }
    const numberValue = typeof value === 'number' ? value : Number(value);
    
    return Number.isFinite(numberValue)
      ? numberValue.toLocaleString('en-US', {
          minimumFractionDigits: eliminateDecimals ? 0 : 3,
          maximumFractionDigits: eliminateDecimals ? 0 : 3,
        })
      : String(value);
  }
}