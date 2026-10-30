import { Component, inject, input, OnInit, signal } from '@angular/core';
import { ImpactMasterDetailDto } from './project-details.model';
import { ProjectDetailsService } from './project-details.service';
import { take } from 'rxjs';
import { DatePipe } from '@angular/common';
import { FormatAmountPipe } from '../../../../../shared/pipes/format-amount.pipe';
@Component({
  selector: 'app-project-details',
  imports: [DatePipe, FormatAmountPipe],
  templateUrl: './project-details.html',
  styleUrl: './project-details.css',
})
export class ProjectDetailsComponent implements OnInit {
  
  readonly impactMasterId = input.required<number | null>();
  protected readonly projectDetails =  signal<ImpactMasterDetailDto | null>(null);
  protected readonly impactSvc = inject(ProjectDetailsService);

  ngOnChanges() {
    this.getImpactMasterDetails();
  }

  ngOnInit() {
    this.getImpactMasterDetails();
  }

  getImpactMasterDetails() {
    if (this.impactMasterId()) {
      this.impactSvc.getImpactMasterById(this.impactMasterId() as number).pipe(take(1)).subscribe((data) => {
        this.projectDetails.set(data);
      });

    }
  }
}
