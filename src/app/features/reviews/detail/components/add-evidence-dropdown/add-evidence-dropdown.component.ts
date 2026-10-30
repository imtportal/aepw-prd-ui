import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  Plus, Upload, X, FileText,
} from 'lucide-angular';
import { MetricEvidenceType } from '../../../../admin/models/metric.model';
import { MetricService } from '../../../../admin/services/metric.service';
import { take } from 'rxjs';
import { FormsModule } from '@angular/forms';

const EVIDENCE_TYPES = [
  'Collection Report',
  'Weighbridge Ticket',
  'Recycling Manifest',
  'Site Photo',
  'Invoice / Receipt',
  'Agreement / MOU',
  'Survey Report',
  'Payroll Record',
  'Certificate',
  'Other Document',
] as const;

@Component({
  selector: 'app-add-evidence-dropdown',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ Plus, Upload, X, FileText }) },
  ],
  templateUrl: './add-evidence-dropdown.component.html',
})
export class AddEvidenceDropdownComponent {
  /** The "+ Add Evidence" trigger is only meaningful for the project-library path. */
  fromQueue = input(false);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly evidenceTypes = EVIDENCE_TYPES;
  protected readonly modalOpen    = signal(false);
  protected readonly isDragging   = signal(false);

  public evidenceUploadMaxFileSize = input<string>("20 MB");

  protected selectedType = ('');
  protected readonly selectedFiles = signal<File[]>([]);

  protected metricSvc = inject(MetricService);

  public readonly metricId = input<number | null>(null);
  public readonly evidenceTypeList = signal<MetricEvidenceType[]>([]);

  readonly filesSelected = output<{ type: string; files: FileList, evidenceType: string }>();

  protected openModal(): void {
    this.selectedType = ('');
    this.selectedFiles.set([]);
    this.modalOpen.set(true);

    this.refreshEvidenceTypeList();
  }
  
  refreshEvidenceTypeList() {
    // this.evidenceTypeList
    const metricId = this.metricId();
    if (metricId) {
      this.metricSvc.getEvidenceTypeForMetric([], [metricId])
      .pipe(take(1))
      .subscribe(evidenceTypeList => {
        this.evidenceTypeList.set(evidenceTypeList);
      })
    }
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  protected onTypeChange(e: Event): void {
    // this.selectedType.set((e.target as HTMLSelectElement).value);
  }

  protected pickFile(): void {
    const el = this.fileInput().nativeElement;
    el.value = '';
    el.click();
  }

  protected onFilePicked(e: Event): void {
    const files = (e.target as HTMLInputElement).files;
    this.addFiles(files);
  }

  protected onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(): void {
    this.isDragging.set(false);
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    const files = e.dataTransfer?.files;
    this.addFiles(files ?? null);
  }

  private addFiles(files: FileList | null): void {
    if (!files?.length) return;
    this.selectedFiles.update(selected => [...selected, ...Array.from(files)]);
  }

  protected onUpload(): void {
    const files = this.selectedFiles();
    if (!files.length) return;
    const fileList = new DataTransfer();
    files.forEach(file => fileList.items.add(file));
    this.filesSelected.emit({
      type: this.selectedType || 'Other Document',
      files: fileList.files,
      evidenceType: this.selectedType,
    });
    this.closeModal();
  }

  protected get fileLabel(): string {
    const f = this.selectedFiles();
    return f.length === 1 ? f[0].name : `${f.length} files selected`;
  }
}
