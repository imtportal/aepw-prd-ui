import { Component, computed, input } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  Pencil, TriangleAlert, Upload, FileText, RotateCcw, Rocket, CircleCheck, Shield,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { AuditEvent, AuditEventType } from '../../models/audit.model';

@Component({
  selector: 'app-audit-event-row',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({
        Pencil, TriangleAlert, Upload, FileText, RotateCcw, Rocket, CircleCheck, Shield,
      }) },
  ],
  templateUrl: './audit-event-row.component.html',
})
export class AuditEventRowComponent {
  event = input.required<AuditEvent>();

  private readonly eventTypeConfig: Record<AuditEventType, { iconName: string; color: string; bgColor: string }> = {
    metric_change:    { iconName: 'pencil',          color: 'text-[hsl(var(--aepw-blue))]',   bgColor: 'bg-[hsl(var(--aepw-blue)/0.1)]'   },
    risk_change:      { iconName: 'triangle-alert',  color: 'text-[hsl(var(--aepw-orange))]', bgColor: 'bg-[hsl(var(--aepw-orange)/0.1)]' },
    evidence_added:   { iconName: 'upload',          color: 'text-[hsl(var(--aepw-green))]',  bgColor: 'bg-[hsl(var(--aepw-green)/0.1)]'  },
    evidence_removed: { iconName: 'file-text',       color: 'text-muted-foreground',           bgColor: 'bg-muted'                         },
    restatement:      { iconName: 'rotate-ccw',      color: 'text-[hsl(var(--aepw-orange))]', bgColor: 'bg-[hsl(var(--aepw-orange)/0.1)]' },
    launch:           { iconName: 'rocket',          color: 'text-[hsl(var(--aepw-blue))]',   bgColor: 'bg-[hsl(var(--aepw-blue)/0.1)]'   },
    approval:         { iconName: 'circle-check',    color: 'text-[hsl(var(--aepw-green))]',  bgColor: 'bg-[hsl(var(--aepw-green)/0.1)]'  },
    rejection:        { iconName: 'shield',          color: 'text-destructive',                bgColor: 'bg-destructive/10'                },
    status_change:    { iconName: 'circle-check',    color: 'text-[hsl(var(--aepw-blue))]',   bgColor: 'bg-[hsl(var(--aepw-blue)/0.1)]'   },
  };

  protected readonly config = computed(() => this.eventTypeConfig[this.event().type]);

  private readonly categoryColors: Record<string, string> = {
    MW: 'bg-[hsl(var(--aepw-blue))] text-white text-[10px] font-bold',
    CV: 'bg-[hsl(var(--aepw-green))] text-white text-[10px] font-bold',
    EE: 'bg-[hsl(var(--aepw-orange))] text-white text-[10px] font-bold',
    MC: 'bg-[hsl(var(--aepw-orange))] text-white text-[10px] font-bold',
    SB: 'bg-[hsl(var(--aepw-blue)/0.5)] text-white text-[10px] font-bold',
  };

  protected readonly categoryBadgeClass = computed(() =>
    this.categoryColors[this.event().category ?? ''] ?? 'text-[10px] font-bold'
  );
}
