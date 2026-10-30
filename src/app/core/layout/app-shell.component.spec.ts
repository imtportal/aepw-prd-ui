import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { AppShellComponent } from './app-shell.component';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let component: AppShellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('computes pageTitle as Dashboard for root path', () => {
    expect(component.pageTitle()).toBe('Dashboard');
  });

  it('isReviewDetail is false for root path', () => {
    expect(component.isReviewDetail()).toBe(false);
  });
});
