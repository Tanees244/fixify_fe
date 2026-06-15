import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 50, trail = '...'): string {
    if (!value || value.length <= limit) return value;
    return value.slice(0, limit).trim() + trail;
  }
}
