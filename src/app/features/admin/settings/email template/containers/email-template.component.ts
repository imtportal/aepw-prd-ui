import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import type Quill from 'quill';

import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { EmailNotificationTemplateService } from '../services/email-template.service';
import {
  EmailNotificationInterpolationKeywordModel,
  EmailNotificationTemplateSaveRequest,
  EmailNotificationTemplateResponse,
} from '../models/email-template.model';
import { AuthStateService } from '../../../../../core/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

@Component({
  selector: 'email-template-component',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, QuillModule],
  templateUrl: './email-template.component.html',
})
export class EmailTemplateComponent implements OnInit {
  private readonly authStateService = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  // quill
  readonly quillModules = {
    toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link']],
  };
  private quillInstance: Quill | null = null;
  readonly bodyHtml = signal('');
  readonly subject = signal('');
  readonly selectedTo = signal<string[]>([]);
  readonly selectedCc = signal<string[]>([]);
  ////////////////////////////////////////////
  private readonly templateService = inject(EmailNotificationTemplateService);
  private readonly toast = inject(ToastService);
  readonly isTemplatesLoading = signal(false);
  readonly isTemplateContentLoading = signal(false);
  readonly templates = signal<EmailNotificationTemplateResponse[]>([]);
  readonly keywords = signal<EmailNotificationInterpolationKeywordModel[]>([]);
  readonly recipientKeywords = computed(() =>
    this.keywords().filter((keyword) => keyword.keywordType === 'Recipient'),
  );
  readonly keywordDropdownPosition = signal({
    top: 0,
    left: 0,
  });
  readonly selectedTemplateId = signal<number | null>(null);
  readonly selectedTemplate = computed(() => {
    const id = this.selectedTemplateId();

    if (id === null) {
      return null;
    }

    return this.templates().find((template) => template.emailNotificationTemplateId === id) ?? null;
  });

  readonly bodyKeywords = computed(() =>
    this.keywords().filter(
      (keyword) =>
        keyword.keywordType === 'Body' ||
        (keyword.keywordType === 'Recipient' &&
          keyword.keyword !== 'AdminProgramSupport' &&
          keyword.keyword !== 'AdminImpactMetricsTeam'),
    ),
  );
  readonly showKeywordDropdown = signal(false);
  readonly keywordSearchText = signal('');

  readonly filteredBodyKeywords = computed(() => {
    const search = this.keywordSearchText().trim().toLowerCase();

    if (!search) {
      return this.bodyKeywords();
    }

    return this.bodyKeywords().filter(
      (keyword) =>
        keyword.description?.toLowerCase().includes(search) ||
        keyword.keyword.toLowerCase().includes(search),
    );
  });
  onEditorCreated(quill: Quill): void {
    this.quillInstance = quill;
  }
  onBodyContentChanged(event: { html: string | null; editor: Quill }): void {
    this.bodyHtml.set(event.html ?? '');
    this.updateKeywordDropdown(event.editor);
  }

  onBodySelectionChanged(event: { editor: Quill }): void {
    this.updateKeywordDropdown(event.editor);
  }

  private updateKeywordDropdown(quill: Quill): void {
    const selection = quill.getSelection();

    if (!selection) {
      this.showKeywordDropdown.set(false);
      this.keywordSearchText.set('');
      return;
    }

    const textBeforeCursor = quill.getText(0, selection.index);

    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (!match) {
      this.showKeywordDropdown.set(false);
      this.keywordSearchText.set('');
      return;
    }

    this.keywordSearchText.set(match[1] ?? '');

    const bounds = quill.getBounds(selection.index);

    if (!bounds) {
      this.showKeywordDropdown.set(false);
      return;
    }

    const quillRect = quill.container.getBoundingClientRect();
    const wrapperElement = quill.container.parentElement?.parentElement;

    if (!wrapperElement) {
      this.showKeywordDropdown.set(false);
      return;
    }

    const wrapperRect = wrapperElement.getBoundingClientRect();

    this.keywordDropdownPosition.set({
      top: quillRect.top - wrapperRect.top + bounds.top + bounds.height,

      left: quillRect.left - wrapperRect.left + bounds.left,
    });

    this.showKeywordDropdown.set(true);
  }
  insertKeyword(keyword: EmailNotificationInterpolationKeywordModel): void {
    const quill = this.quillInstance;

    if (!quill) {
      return;
    }

    const selection = quill.getSelection();

    if (!selection) {
      return;
    }

    const textBeforeCursor = quill.getText(0, selection.index);

    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (!match) {
      return;
    }

    const searchText = match[1] ?? '';

    const replacementLength = searchText.length + 1;
    const startIndex = selection.index - replacementLength;

    const interpolation = `{{${keyword.keyword}}}`;

    quill.deleteText(startIndex, replacementLength, 'user');

    quill.insertText(startIndex, interpolation, 'user');

    quill.setSelection(startIndex + interpolation.length, 0, 'silent');

    this.showKeywordDropdown.set(false);
    this.keywordSearchText.set('');
  }
  ////////////////////////////////////////////////////////////////////////////////////////////
  ngOnInit(): void {
    this.loadTemplates();
    this.loadKeywords();
  }

  private loadTemplates(): void {
    this.isTemplatesLoading.set(true);

    console.log('[EmailTemplate] Loading started');

    this.templateService
      .getAllEmailNotificationTemplates()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          console.log('[EmailTemplate] Finalize executed');

          this.isTemplatesLoading.set(false);

          console.log('[EmailTemplate] Loading state:', this.isTemplatesLoading());
        }),
      )
      .subscribe({
        next: (response) => {
          const templates = response.data ?? [];

          console.log('[EmailTemplate] Response:', response);
          console.log('[EmailTemplate] Template count:', templates.length);

          this.templates.set(templates);

          const defaultTemplate = templates.find((template) => template.isActive);

          if (defaultTemplate) {
            this.applyTemplate(defaultTemplate);
          }
        },
        error: (error) => {
          console.error('[EmailTemplate] Request failed:', error);
        },
      });
  }

  private loadKeywords(): void {
    this.templateService
      .getAllInterpolationKeywords()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.keywords.set(response.data ?? []);
        },
        error: (error) => {
          console.error('Failed to load interpolation keywords', error);
        },
      });
  }

  onTemplateChange(templateId: number | null): void {
    if (templateId == null) {
      return;
    }

    const template = this.templates().find(
      (item) => item.emailNotificationTemplateId === templateId,
    );

    if (!template) {
      return;
    }

    this.applyTemplate(template);
  }

  private applyTemplate(template: EmailNotificationTemplateResponse): void {
    // Update the selected template and all associated fields together.
    this.selectedTemplateId.set(template.emailNotificationTemplateId);

    this.subject.set(template.subjectTemplate ?? '');
    this.bodyHtml.set(template.bodyTemplate ?? '');

    this.selectedTo.set(this.parseRecipientValues(template.recipientTo));

    this.selectedCc.set(this.parseRecipientValues(template.recipientCc));

    // No requestAnimationFrame and no editor teardown.
  }

  saveTemplate(): void {
    const template = this.selectedTemplate();

    if (!template) {
      return;
    }

    const payload: EmailNotificationTemplateSaveRequest = {
      emailNotificationTemplateId: template.emailNotificationTemplateId,
      templateCode: template.templateCode,
      templateName: template.templateName,
      subjectTemplate: this.subject(),
      bodyTemplate: this.bodyHtml(),
      recipientTo: this.selectedTo().join(';'),
      recipientCc: this.selectedCc().length > 0 ? this.selectedCc().join(';') : null,
      isActive: template.isActive,
      updatedBy: String(this.authStateService.getCurrentUserId()),
    };

    this.templateService.saveEmailNotificationTemplate(payload).subscribe({
      next: () => {
        this.toast.success('Email template saved successfully');
      },
      error: (error) => {
        console.error('Failed to save email notification template', error);
        this.toast.error(
          error.error?.message ?? 'Failed to save email template. Please try again.',
        );
      },
    });
  }

  private populateTemplateFields(template: EmailNotificationTemplateResponse): void {
    this.subject.set(template.subjectTemplate);
    this.bodyHtml.set(template.bodyTemplate);
    this.selectedTo.set(this.parseRecipientValues(template.recipientTo));
    this.selectedCc.set(this.parseRecipientValues(template.recipientCc));
  }

  private parseRecipientValues(value: string | null): string[] {
    return value
      ? value
          .split(';')
          .map((recipient) => recipient.trim())
          .filter(Boolean)
      : [];
  }
}
