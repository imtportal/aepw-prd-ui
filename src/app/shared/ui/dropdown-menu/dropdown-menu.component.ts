import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'ui-dropdown-menu',
  standalone: true,
  templateUrl: './dropdown-menu.component.html',
})
export class DropdownMenuComponent {
  readonly isOpen = signal(false);

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isOpen.set(false);
  }
}
