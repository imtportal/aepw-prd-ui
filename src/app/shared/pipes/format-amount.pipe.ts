import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatAmount',
  standalone: true,
})
export class FormatAmountPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (String(value) == "" || value == undefined || value == null) {
      return "";
    }
    const numberValue = typeof value === 'number' ? value : Number(value);
    
    return Number.isFinite(numberValue)
      ? numberValue.toLocaleString('en-US', {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        })
      : String(value);
  }
}