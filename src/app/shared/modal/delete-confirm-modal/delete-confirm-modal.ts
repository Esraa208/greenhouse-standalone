import { CommonModule } from '@angular/common';
import { Component, HostListener, input, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes';

@Component({
  selector: 'gh-delete-confirm-modal',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './delete-confirm-modal.html',
  styleUrl: './delete-confirm-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmModalComponent {
  readonly isOpen         = input.required<boolean>();
  readonly itemName       = input<string>('');
  readonly canDelete      = input<boolean>(true);
  readonly warningMessage = input<string>('');

  readonly closed    = output<void>();
  readonly confirmed = output<void>();

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen()) this.closed.emit();
  }
}
