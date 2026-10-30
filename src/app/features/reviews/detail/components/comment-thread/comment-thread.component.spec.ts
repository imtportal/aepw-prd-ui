import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentThreadComponent } from './comment-thread.component';
import { ReviewCommentDto } from '../../../models/review.model';

const MOCK_COMMENTS: ReviewCommentDto[] = [
  { reviewCommentId: 1, reviewId: 1, author: 'Sarah Chen',   role: 'PM',       body: 'Looks good',      createdOnUtc: '2025-07-18T14:32:00Z' },
  { reviewCommentId: 2, reviewId: 1, author: 'James Wright', role: 'Reviewer', body: 'Needs more data', createdOnUtc: '2025-07-19T09:00:00Z' },
];

describe('CommentThreadComponent', () => {
  let fixture: ComponentFixture<CommentThreadComponent>;
  let component: CommentThreadComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentThreadComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CommentThreadComponent);
    component = fixture.componentInstance;
  });

  it('renders one row per comment', () => {
    fixture.componentRef.setInput('comments', MOCK_COMMENTS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-comment-row]').length).toBe(2);
  });

  it('renders comment author and text', () => {
    fixture.componentRef.setInput('comments', MOCK_COMMENTS);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sarah Chen');
    expect(fixture.nativeElement.textContent).toContain('Looks good');
  });

  it('formats timestamp using formatDateTime', () => {
    fixture.componentRef.setInput('comments', [MOCK_COMMENTS[0]]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('18 Jul 14:32');
  });

  it('Submit button is disabled when input is empty', () => {
    fixture.componentRef.setInput('comments', []);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('[data-submit-btn]');
    expect(btn.disabled).toBe(true);
  });

  it('emits addComment when Submit clicked with text', () => {
    fixture.componentRef.setInput('comments', []);
    fixture.detectChanges();
    let emitted: string | undefined;
    component.addComment.subscribe((t: string) => (emitted = t));

    const input = fixture.nativeElement.querySelector('[data-comment-input]');
    input.value = 'My new comment';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-submit-btn]').click();
    expect(emitted).toBe('My new comment');
  });

  it('clears input after emit', () => {
    fixture.componentRef.setInput('comments', []);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('[data-comment-input]');
    input.value = 'My comment';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-submit-btn]').click();
    fixture.detectChanges();

    expect(input.value).toBe('');
  });
});
