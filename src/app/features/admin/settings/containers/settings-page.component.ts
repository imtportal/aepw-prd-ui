import { BusinessRoleComponent } from '../business role mapping/containers/business-role-page.component';
import { EmailTemplateComponent } from '../email template/containers/email-template.component';
import { ReviewStageConfigComponent } from '../review-stage-config/containers/review-stage-config.component';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
} from '../../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import { ToggleComponent } from '../../../../shared/ui/toggle/toggle.component';
import { SelectOption } from '../../../../shared/models/select-option';
import { PageLoadingService } from '../../../../core/services/page-loading.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    FormsModule,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    BadgeComponent,
    SelectComponent,
    ToggleComponent,
    BusinessRoleComponent,
    EmailTemplateComponent,
    ReviewStageConfigComponent,
  ],
  templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent {
  private readonly pageLoadingService = inject(PageLoadingService);

  ngOnInit(): void {
    this.pageLoadingService.stop();
  }

  readonly activeTab = signal<
    | 'business-roles'
    | 'review'
    // | 'review-stage-config'
    | 'notifications'
    | 'evidence'
    // | 'email-template'
    | 'integrations'
  >('business-roles');

  readonly q1Deadline = signal('Apr 15');
  readonly q2Deadline = signal('Jul 15');
  readonly q3Deadline = signal('Oct 15');
  readonly q4Deadline = signal('Jan 15');
  readonly dataCollectionDays = signal(14);
  readonly evidenceWindowDays = signal(21);
  readonly approvalStages = signal('4');

  readonly notifyReviewLaunch = signal(true);
  readonly notifyDeadlines = signal(true);
  readonly deadlineReminderDays = signal('3');
  readonly notifyApproval = signal(true);
  readonly notifyEvidence = signal(true);

  readonly maxFileSizeMb = signal(25);
  readonly aiEnabled = signal(true);
  readonly aiConfidenceThreshold = signal(85);
  readonly aiManualReviewThreshold = signal(70);

  protected readonly tabs = [
    // { id: 'review' as const, label: 'Review Cycles' },
    { id: 'business-roles' as const, label: 'Business Roles' },
    // { id: 'email-template' as const, label: 'Email Template' },
    // { id: 'review-stage-config' as const, label: 'Review Stage Config' },
    // { id: 'notifications' as const, label: 'Notifications' },
    // { id: 'evidence' as const, label: 'Evidence' },
    // { id: 'integrations' as const, label: 'Integrations' },
  ];

  protected readonly quarters = [
    { label: 'Q1 (Jan–Mar)', sig: this.q1Deadline },
    { label: 'Q2 (Apr–Jun)', sig: this.q2Deadline },
    { label: 'Q3 (Jul–Sep)', sig: this.q3Deadline },
    { label: 'Q4 (Oct–Dec)', sig: this.q4Deadline },
  ];

  protected readonly fileTypes = ['.xlsx', '.pdf', '.jpg', '.png', '.csv'];

  protected readonly activeTabClass =
    'rounded px-4 py-1.5 text-sm font-medium bg-background shadow';
  protected readonly inactiveTabClass = 'rounded px-4 py-1.5 text-sm text-muted-foreground';

  protected readonly approvalStagesOptions: SelectOption[] = [
    { value: '2', label: '2 stages' },
    { value: '3', label: '3 stages' },
    { value: '4', label: '4 stages' },
    { value: '5', label: '5 stages' },
  ];
  protected readonly reminderDaysOptions: SelectOption[] = [
    { value: '1', label: '1 day' },
    { value: '3', label: '3 days' },
    { value: '5', label: '5 days' },
    { value: '7', label: '7 days' },
  ];

  get approvalStagesModel(): string {
    return this.approvalStages();
  }
  set approvalStagesModel(v: string) {
    this.approvalStages.set(v);
  }
  get deadlineReminderDaysModel(): string {
    return this.deadlineReminderDays();
  }
  set deadlineReminderDaysModel(v: string) {
    this.deadlineReminderDays.set(v);
  }

  onSave(): void {
    console.log('Settings saved');
  }
}
