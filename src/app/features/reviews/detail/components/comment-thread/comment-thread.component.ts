import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ReviewCommentDto } from '../../../models/review.model';
import { formatDateTime } from '../../../../../shared/utils/date.utils';
import { FormsModule } from '@angular/forms';
import { Ban, Hourglass, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../admin/services/user.service';
import { AdUserService } from '../../../../admin/users/services/user-service';
import { take } from 'rxjs';

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  templateUrl: './comment-thread.component.html',
  styleUrls: ['./comment-thread.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ Hourglass, Ban }) },
  ],
})
export class CommentThreadComponent {
  public comments   = input.required<ReviewCommentDto[]>();
  public showHeader = input<boolean>(true);
  public allowMentioningUsers = input<boolean>(false);

  protected userService = inject(AdUserService);
  protected showSuggestionBox = signal<boolean>(false);
  protected suggestionList = signal<{id: string; text: string}[]>([]);
  protected suggestionBoxCoords = signal<{top: number, left: number}>({top: 0, left: 0});
  protected loadingSuggestions = signal<boolean>(false);

  protected showMoreForComments = signal<{[key: number]: boolean}>({});
  protected notToBeShortened = signal<{[key: number]: boolean}>({});
  addComment = output<{ body: string; mentionedUsers: number[] }>();
  addingComments = input<ReviewCommentDto[]>([]);

  disableSubmitButton = signal<boolean>(false);
  commentText$ = computed(() => this.commentText?.trim());

  protected commentText = ('');
  protected readonly formatDate = formatDateTime;

  constructor() {
    effect(() => {
      const comments = this.comments();

      for (const comment of comments) {
        if (comment.body.length < 100) {
          this.notToBeShortened.update((prev) => ({ ...prev, [comment.reviewCommentId]: true }));
        }
      }
    })  
  }

  onTextChange($event: any): void {
    const val: string = typeof $event === 'string' ? $event : ($event.target as HTMLInputElement).value;
    if (!val?.trim()) {
      this.disableSubmitButton.set(true);
      return;
    }
    this.disableSubmitButton.set(false);
    this.commentText = val;
    
    if (val.includes("@")) {
      this.showHideSuggestionBox(true);
    }

    if (this.showSuggestionBox()) {
      let indexOfAtSymbol = val.lastIndexOf("@");

      let endSearchTextIndex = 0;

      for (let i = indexOfAtSymbol + 1; i < val.length; i++) {
        const char = val[i];
        if (char === ' ') {
          endSearchTextIndex = i;
          break;
        }
      }

      const searchText = val.substring(indexOfAtSymbol + 1, endSearchTextIndex || val.length);

      this.loadSuggestions(searchText);
      // this.showHideSuggestionBox(false);
    }

    if (!val.includes("@")) {
      this.showHideSuggestionBox(false);
    }

  }

  showHideSuggestionBox(show: boolean): void {
    this.showSuggestionBox.set(show);
  }

  loadSuggestions(searchText: string): void {
    this.loadingSuggestions.set(true);
    this.userService.getUsers(1, 100, searchText).pipe(
      take(1)
    ).subscribe(res => {
      const suggestionsList: {id: string, text: string}[] = [];

      for (const item of res.data.items) {
        suggestionsList.push({ id: item.userId, text: item.displayName });
        this.cachedUsers.update((prev) => ({ ...prev, [item.userId]: item.displayName }));
      }
      
      this.suggestionList.set(suggestionsList);
      this.loadingSuggestions.set(false);
    }, () => {
      this.loadingSuggestions.set(false);

    });
  }
  onKeyPress($event: KeyboardEvent): void {
    if ($event.key === 'Escape' && !($event.shiftKey || $event.ctrlKey || $event.altKey)) {
      $event.preventDefault();
      this.showHideSuggestionBox(false);
    }
  
    // console.log('onKeyPress', $event);
    // if ($event.key === 'Enter' && !($event.shiftKey || $event.ctrlKey || $event.altKey)) {
    //   $event.preventDefault();
    //   this.onSubmit();
    // }
  }

  private mentionedUsers = signal<number[]>([]);
  private cachedUsers = signal<{[key: number]: string}>({});

  mentionUser(suggestion: {id: string, text: string}): void {

    const cachedUsers = this.cachedUsers();

    const mentionedUserName = cachedUsers[parseInt(suggestion.id)]

    if (mentionedUserName) {
      const lastAtIndex = this.commentText.lastIndexOf("@");
      let nextSpaceIndex = 0;

      for (let i = lastAtIndex + 1; i < this.commentText.length; i++) {
        const char = this.commentText[i];
        if (char === ' ') {
          nextSpaceIndex = i;
          break;
        }
      }

      const newCommentText = this.commentText.substring(0, lastAtIndex) + " " + mentionedUserName + " " + this.commentText.substring(nextSpaceIndex || this.commentText.length);
      this.commentText = newCommentText;
    }

    this.mentionedUsers.update(prev => { 
      if (prev.some(mentionedUserId => mentionedUserId === parseInt(suggestion.id))) {
        return prev;
      }

      return [...prev, parseInt(suggestion.id)];
    });

    this.showHideSuggestionBox(false);
  }

  onSubmit(): void {
    const body = (this.commentText || '').trim();
    const cachedUsers = this.cachedUsers();
    if (!body) return;
    const mentionedUsersRaw = this.mentionedUsers();
    const mentionedUsers: number[] = [];

    for (const userId of mentionedUsersRaw) {
      if (body.includes(cachedUsers[userId])) {
        mentionedUsers.push(userId);
      }
    }

    this.addComment.emit({ body, mentionedUsers });
    this.commentText = '';
    this.onTextChange('');
  }

  showMoreOrLess(commentId: number, val: boolean): void {
    this.showMoreForComments.update((prev) => ({ ...prev, [commentId]: val }));
  }
}
