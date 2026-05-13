// libs/shared/ui/src/lib/avatar/avatar.component.ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'gh-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"gh-avatar gh-avatar--" + size()',
  }
})
export class AvatarComponent {
  readonly name = input<string>('');
  readonly imageUrl = input<string | null>(null);
  readonly size = input<AvatarSize>('md');

  readonly initials = computed(() => {
    const n = this.name().trim();
    if (!n) return '?';
    const parts = n.split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });
}





