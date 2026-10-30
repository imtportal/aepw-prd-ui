import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, Upload,
} from 'lucide-angular';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import { SelectOption } from '../../../../shared/models/select-option';

@Component({
  selector: 'app-evidence-upload-dialog',
  standalone: true,
  imports: [LucideAngularModule, SelectComponent, FormsModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Upload }) },
  ],
  templateUrl: './evidence-upload-dialog.component.html',
})
export class EvidenceUploadDialogComponent {
  visible  = input<boolean>(false);
  projects = input<SelectOption[]>([]);
  close    = output<void>();
  upload   = output<void>();

  protected readonly selectedProject = signal('');
  protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInputRef');
}
