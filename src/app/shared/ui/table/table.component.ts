import { Component, computed, input } from '@angular/core';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-table',
  standalone: true,
  templateUrl: './table.component.html',
})
export class TableComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() => cn('w-full caption-bottom text-sm', this.styleClass()));
}

@Component({
  selector: 'ui-table-header',
  standalone: true,
  templateUrl: './table-thead.component.html',
})
export class TableHeaderComponent {}

@Component({
  selector: 'ui-table-body',
  standalone: true,
  templateUrl: './table-tbody.component.html',
})
export class TableBodyComponent {}

@Component({
  selector: 'ui-table-footer',
  standalone: true,
  templateUrl: './table-tfoot.component.html',
})
export class TableFooterComponent {}

@Component({
  selector: 'ui-table-row',
  standalone: true,
  templateUrl: './table-header.component.html',
})
export class TableRowComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() =>
    cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', this.styleClass()),
  );
}

@Component({
  selector: 'ui-table-head',
  standalone: true,
  templateUrl: './table-footer.component.html',
})
export class TableHeadComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() =>
    cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0', this.styleClass()),
  );
}

@Component({
  selector: 'ui-table-cell',
  standalone: true,
  templateUrl: './table-row.component.html',
})
export class TableCellComponent {
  readonly styleClass = input<string>('');
  protected readonly classes = computed(() =>
    cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', this.styleClass()),
  );
}

@Component({
  selector: 'ui-table-caption',
  standalone: true,
  templateUrl: './table-head.component.html',
})
export class TableCaptionComponent {}
