import { TestBed } from '@angular/core/testing';

import { CommentThreadService } from './comment-thread.service';

describe('CommentThreadService', () => {
  let service: CommentThreadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentThreadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
