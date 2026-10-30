import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BadgeComponent } from "../badge/badge.component";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() badgeText = '';
  @Input() badgeColor = '';
  @Output() closed = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  onBackdropClick() {
    this.closed.emit();
  }

  onClose() {
    this.closed.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  onSave() {
    this.save.emit();
  }
}
