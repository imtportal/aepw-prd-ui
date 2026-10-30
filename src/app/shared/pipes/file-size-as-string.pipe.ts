import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSizeAsString',
  standalone: true,
})
export class FileSizeAsString implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    currentUnit: 'bytes' | 'kb' | 'mb' = 'bytes'
  ): string {
    if (value === null || value === undefined || String(value).trim() === '') {
      return '';
    }

    let bytes = Number(value);

    switch (currentUnit) {
      case 'kb':
        bytes *= 1024;
        break;
      case 'mb':
        bytes *= 1024 * 1024;
        break;
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }

    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }

    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  }
}