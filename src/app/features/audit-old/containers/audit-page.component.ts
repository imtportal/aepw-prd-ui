import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { KeyValue, KeyValuePipe } from '@angular/common';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, ListFilter,
} from 'lucide-angular';
import {
  CardComponent, CardContentComponent,
  CardHeaderComponent, CardTitleComponent, CardDescriptionComponent,
} from '../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { AuditService } from '../services/audit.service';
import { AuditEvent, AuditEventType } from '../models/audit.model';
import { AuditEventRowComponent } from '../components/audit-event-row/audit-event-row.component';
import { SelectOption } from '../../../shared/models/select-option';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [
    FormsModule, KeyValuePipe, LucideAngularModule,
    CardComponent, CardContentComponent, CardHeaderComponent,
    CardTitleComponent, CardDescriptionComponent,
    BadgeComponent, SelectComponent, AuditEventRowComponent,
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ListFilter }) },
  ],
  templateUrl: './audit-page.component.html',
})
export class AuditPageComponent {
  private readonly auditSvc   = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.auditSvc.loadPaged({ page: 0, pageSize: 1000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  readonly typeFilter = signal<AuditEventType | 'all'>('all');

  readonly filteredEvents = computed(() => {
    const f   = this.typeFilter();
    const evs = this.auditSvc.events();
    return f === 'all' ? evs : evs.filter(e => e.type === f);
  });

  readonly eventCount = computed(() => this.filteredEvents().length);

  readonly groupedByDate = computed(() => {
    const map = new Map<string, AuditEvent[]>();
    for (const ev of this.filteredEvents()) {
      const group = map.get(ev.date) ?? [];
      group.push(ev);
      map.set(ev.date, group);
    }
    return map;
  });

  // Getter/setter bridge for SelectComponent (ControlValueAccessor)
  protected get typeFilterModel(): string { return this.typeFilter(); }
  protected set typeFilterModel(v: string) { this.typeFilter.set(v as AuditEventType | 'all'); }

  readonly dateCompare = (
    a: KeyValue<string, AuditEvent[]>,
    b: KeyValue<string, AuditEvent[]>,
  ): number => new Date(b.key).getTime() - new Date(a.key).getTime();

  protected readonly filterOptions: SelectOption[] = [
    { value: 'all',              label: 'All Events'       },
    { value: 'metric_change',    label: 'Metric Changes'   },
    { value: 'risk_change',      label: 'Risk Changes'     },
    { value: 'evidence_added',   label: 'Evidence Added'   },
    { value: 'evidence_removed', label: 'Evidence Removed' },
    { value: 'restatement',      label: 'Restatements'     },
    { value: 'approval',         label: 'Approvals'        },
    { value: 'rejection',        label: 'Rejections'       },
    { value: 'launch',           label: 'Launch Events'    },
  ];
}
