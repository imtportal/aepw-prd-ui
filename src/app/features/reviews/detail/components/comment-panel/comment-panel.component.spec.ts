import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentPanel } from './comment-panel';

describe('CommentPanel', () => {
  let component: CommentPanel;
  let fixture: ComponentFixture<CommentPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommentPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
