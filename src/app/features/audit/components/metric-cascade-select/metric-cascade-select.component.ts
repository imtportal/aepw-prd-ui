import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  ChevronDown,
  ChevronRight,
  Check,
  Minus,
  Search,
  X,
  Layers,
  CheckSquare,
} from 'lucide-angular';

export interface MetricTreeNode {
  metricId: number | string;
  code: string;
  name: string;
  isTopLevel: boolean;
  children: MetricTreeNode[];
}

@Component({
  selector: 'app-metric-cascade-select',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        ChevronDown,
        ChevronRight,
        Check,
        Minus,
        Search,
        X,
        Layers,
        CheckSquare,
      }),
    },
  ],
  templateUrl: './metric-cascade-select.component.html',
  styleUrls: ['./metric-cascade-select.component.css'],
})
export class MetricCascadeSelectComponent {
  private readonly elementRef = inject(ElementRef);

  readonly treeNodes = input<MetricTreeNode[]>([]);
  readonly selectedMetricCode = input<string | null>(null);
  readonly loading = input<boolean>(false);
  readonly placeholder = input<string>('All Metrics (Optional)');

  readonly metricChange = output<string | null>();

  readonly isOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly expandedParents = signal<Set<string>>(new Set<string>());

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  readonly selectedInfo = computed(() => {
    const code = this.selectedMetricCode();
    if (!code) return null;

    for (const parent of this.treeNodes()) {
      if (parent.code === code) {
        const hasChildren = parent.children && parent.children.length > 0;
        return {
          code: parent.code,
          name: parent.name,
          isParent: true,
          label: hasChildren
            ? `${parent.code} - ${parent.name} (All Sub-metrics)`
            : `${parent.code} - ${parent.name}`,
          badgeText: hasChildren ? `${parent.code} (All)` : parent.code,
        };
      }
      for (const child of parent.children) {
        if (child.code === code) {
          return {
            code: child.code,
            name: child.name,
            isParent: false,
            label: `${child.code} - ${child.name}`,
            badgeText: child.code,
          };
        }
      }
    }

    return {
      code,
      name: code,
      isParent: false,
      label: code,
      badgeText: code,
    };
  });

  readonly hasAnyChildren = computed(() => {
    return this.treeNodes().some((p) => p.children && p.children.length > 0);
  });

  readonly filteredTree = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const all = this.treeNodes();

    if (!query) {
      return all;
    }

    const filtered: MetricTreeNode[] = [];
    const autoExpand = new Set(this.expandedParents());

    for (const parent of all) {
      const parentMatches =
        parent.code.toLowerCase().includes(query) ||
        parent.name.toLowerCase().includes(query);

      const matchingChildren = parent.children.filter(
        (c) =>
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query),
      );

      if (parentMatches || matchingChildren.length > 0) {
        filtered.push({
          ...parent,
          children: parentMatches ? parent.children : matchingChildren,
        });
        autoExpand.add(parent.code);
      }
    }

    // Auto-expand parents matching search
    this.expandedParents.set(autoExpand);
    return filtered;
  });

  toggleOpen(event: MouseEvent): void {
    event.stopPropagation();
    if (this.loading()) return;
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);

    // If opening, ensure the selected parent is expanded
    if (nextState) {
      const current = this.selectedMetricCode();
      if (current) {
        for (const p of this.treeNodes()) {
          if (p.code === current || p.children.some((c) => c.code === current)) {
            this.expandedParents.update((set) => new Set(set).add(p.code));
            break;
          }
        }
      }
    }
  }

  isParentExpanded(parentCode: string): boolean {
    return this.expandedParents().has(parentCode);
  }

  toggleExpandParent(parentCode: string, event: MouseEvent): void {
    event.stopPropagation();
    this.expandedParents.update((set) => {
      const next = new Set(set);
      if (next.has(parentCode)) {
        next.delete(parentCode);
      } else {
        next.add(parentCode);
      }
      return next;
    });
  }

  expandAll(event: MouseEvent): void {
    event.stopPropagation();
    const allParentCodes = new Set(this.treeNodes().map((p) => p.code));
    this.expandedParents.set(allParentCodes);
  }

  collapseAll(event: MouseEvent): void {
    event.stopPropagation();
    this.expandedParents.set(new Set());
  }

  isParentChecked(parent: MetricTreeNode): boolean {
    return this.selectedMetricCode() === parent.code;
  }

  isParentIndeterminate(parent: MetricTreeNode): boolean {
    const selected = this.selectedMetricCode();
    if (!selected || selected === parent.code) return false;
    return parent.children.some((c) => c.code === selected);
  }

  isChildChecked(child: MetricTreeNode, parent: MetricTreeNode): boolean {
    const selected = this.selectedMetricCode();
    if (!selected) return false;
    // Parent checked -> all children checked!
    if (selected === parent.code) return true;
    // Specific child checked
    return selected === child.code;
  }

  selectParent(parent: MetricTreeNode, event: MouseEvent): void {
    event.stopPropagation();
    if (this.isParentChecked(parent)) {
      // Toggle off -> clear
      this.metricChange.emit(null);
    } else {
      // Check parent -> covers all children
      this.metricChange.emit(parent.code);
      // Automatically expand parent so user can see children checked
      this.expandedParents.update((set) => new Set(set).add(parent.code));
    }
  }

  selectChild(child: MetricTreeNode, parent: MetricTreeNode, event: MouseEvent): void {
    event.stopPropagation();
    const current = this.selectedMetricCode();
    if (current === child.code) {
      // Uncheck
      this.metricChange.emit(null);
    } else {
      // Check this specific child
      this.metricChange.emit(child.code);
    }
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.metricChange.emit(null);
  }

  selectAllOption(event: MouseEvent): void {
    event.stopPropagation();
    this.metricChange.emit(null);
    this.isOpen.set(false);
  }
}
