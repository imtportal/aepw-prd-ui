import { Component, computed, input, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProjectListDto } from '../../../../admin/models/project.model';

@Component({
  selector: 'app-project-search-step',
  standalone: true,
  templateUrl: './project-search-step.component.html',
})
export class ProjectSearchStepComponent {
  projects   = input.required<ProjectListDto[]>();
  selectedId = input<string | null>(null);

  selectProject = output<string>();

  searchQuery = signal('');

  private readonly debouncedQuery = toSignal(
    toObservable(this.searchQuery).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  readonly filteredProjects = computed(() => {
    const q = this.debouncedQuery().toLowerCase();
    if (!q) return this.projects();
    return this.projects().filter(p =>
      p.pin.toLowerCase().includes(q)
      || p.title.toLowerCase().includes(q)
      || p.pmUserName.toLowerCase().includes(q)
    );
  });
}
