import { Pipe, PipeTransform } from '@angular/core';
import { normalizeGreenhouseLabel } from '@app/shared/utils/normalize-greenhouse-label';

@Pipe({
  name: 'greenhouseLabel',
  standalone: true,
})
export class GreenhouseLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return normalizeGreenhouseLabel(value);
  }
}
