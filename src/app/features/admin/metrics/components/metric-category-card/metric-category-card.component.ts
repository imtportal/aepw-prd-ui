import { Component, computed, effect, input, output, signal } from '@angular/core';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  ChevronDown,
  ChevronRight,
} from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../../../shared/ui/badge/badge.component';
import { MetricCategory, Metric2, MetricCategory2 } from '../../../models/metric.model';
import { AppUserLookup, MetricSourceLookup } from '../../../../../core/models/lookup-model';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { DialogComponent } from '../../../../../shared/ui/dialog/dialog.component';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
@Component({
  selector: 'app-metric-category-card',
  standalone: true,
  imports: [
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    BadgeComponent,
    NgSelectComponent,
    DialogComponent,
    ButtonComponent,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ChevronDown, ChevronRight }),
    },
  ],
  templateUrl: './metric-category-card.component.html',
  styleUrl: './metric-category-card.css',
})
export class MetricCategoryCardComponent {
  // ACTION Permisions
  readonly canEdit = input<boolean>(false);
  readonly canApplicable = input<boolean>(false);
  readonly canICPRequired = input<boolean>(false);
  readonly canSource = input<boolean>(false);
  readonly canRiskRequired = input<boolean>(false);

  // readonly canCategoryDescription = input<boolean>(false);
  // readonly canSeniorLeadershipTeam = input<boolean>(false);

  // readonly canMetricDescription = input<boolean>(false);

  // readonly canGuidingNotes = input<boolean>(false);
  // readonly canICPApprover = input<boolean>(false);
  // lookups
  metricSources = input.required<MetricSourceLookup[]>();
  // users = input.required<AppUserLookup[]>();
  categoryForm = input.required<FormGroup>();
  category = input.required<MetricCategory2>();
  getMetricForm = input.required<(metricId: string) => FormGroup>();
  configureMetric = output<Metric2>();
  configureCategory = output<MetricCategory2>();
  expanded = input<boolean>(false);
  toggleExpand = output<void>();
  readonly invalidMetricIds = input<Set<string>>(new Set());
  readonly invalidTopMetricIds = input<Set<string>>(new Set());
  protected readonly expandedMetrics = signal<Set<string>>(new Set());
  protected readonly showAddModal = signal(false);
  protected readonly expandedEvidence = signal<Set<string>>(new Set());
  constructor() {
    effect(() => {
      const category = this.category();

      if (!category) {
        return;
      }

      this.initializeExpandedMetrics(category);
    });

    effect(() => this.applyActionPermissions());
  }
  // sidebar
  private applyActionPermissions(): void {
    const categoryForm = this.categoryForm();

    // Category-level controls
    this.setControlPermission(categoryForm, 'isActive', this.canApplicable());

    this.setControlPermission(categoryForm, 'isICPRequired', this.canICPRequired());

    this.setControlPermission(categoryForm, 'metricSourceId', this.canSource());

    this.setControlPermission(categoryForm, 'isRiskAdjustmentRequired', this.canRiskRequired());

    // Metric-level controls
    this.displayMetrics().forEach((metric) => {
      const form = this.metricForm(metric.metricId);

      this.setControlPermission(form, 'isActive', this.canApplicable());

      this.setControlPermission(form, 'isICPRequired', this.canICPRequired());

      this.setControlPermission(form, 'metricSourceId', this.canSource());

      this.setControlPermission(form, 'isRiskAdjustmentRequired', this.canRiskRequired());
    });
  }
  private setControlPermission(form: FormGroup, controlName: string, canEdit: boolean): void {
    const control = form.get(controlName);

    if (!control) {
      return;
    }

    if (canEdit) {
      control.enable({ emitEvent: false });
    } else {
      control.disable({ emitEvent: false });
    }
  }
  //////////////////////////////////////////////////////
  readonly metricCount = computed(() => this.displayMetrics().length);

  readonly displayMetrics = computed(() =>
    this.category().metrics.flatMap((metric) => [metric, ...metric.children]),
  );
  protected onConfigureCategory(event: MouseEvent): void {
    event.stopPropagation();
    this.configureCategory.emit(this.category());
  }

  protected onConfigureMetric(metric: Metric2, event: MouseEvent): void {
    event.stopPropagation();
    this.configureMetric.emit(metric);
  }
  protected metricForm(metricId: string): FormGroup {
    return this.getMetricForm()(metricId);
  }

  protected toggleEvidence(metricId: string): void {
    const updated = new Set(this.expandedEvidence());

    if (updated.has(metricId)) {
      updated.delete(metricId);
    } else {
      updated.add(metricId);
    }

    this.expandedEvidence.set(updated);
  }
  protected isEvidenceExpanded(metricId: string): boolean {
    return this.expandedEvidence().has(metricId);
  }
  protected toggleMetric(metricId: string, event: MouseEvent): void {
    event.stopPropagation();

    const expanded = new Set(this.expandedMetrics());

    if (expanded.has(metricId)) {
      expanded.delete(metricId);
    } else {
      expanded.add(metricId);
    }

    this.expandedMetrics.set(expanded);
  }

  protected isMetricExpanded(metricId: string): boolean {
    return this.expandedMetrics().has(metricId);
  }
  private initializeExpandedMetrics(category: MetricCategory2): void {
    const expanded = new Set<string>();

    category.metrics.forEach((metric) => {
      if (metric.children.length > 0) {
        expanded.add(metric.metricId);
      }
    });

    this.expandedMetrics.set(expanded);
  }
}
