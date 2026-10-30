import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommentThreadComponent } from '../comment-thread/comment-thread.component';
import { ReviewCommentDto } from '../review-metrics-by-id/review-metrics-by-id.types';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, X } from 'lucide-angular';

@Component({
  selector: 'app-comment-panel',
  imports: [
    CommonModule,
    FormsModule,
    CommentThreadComponent,
    LucideAngularModule,
  ],  
  
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ X }) }
  ],
  
  templateUrl: './comment-panel.component.html',
  styleUrl: './comment-panel.component.css',
})
export class CommentPanel {
  public readonly comments = input.required<ReviewCommentDto[]>();
  public readonly addingComments = input<ReviewCommentDto[]>([]);
  public readonly period = input.required<string>();
  public readonly isCommentsPanelOpen = input.required<boolean>();

  public readonly addComment = output<{body: string; mentionedUsers: number[]}>();
  public readonly closeCommentPanel = output<void>();
  public readonly allowMentioningUsers = input<boolean>(false);


  constructor() {
    
  }

  handleAddComment($event: {body: string; mentionedUsers: number[]}) {
    this.addComment.emit($event);
  }

  closeCommentSidebar() {
    this.closeCommentPanel.emit();
  }
}
