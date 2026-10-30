// src/app/features/admin/settings/containers/settings-page.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SettingsPageComponent } from './settings-page.component';

describe('SettingsPageComponent', () => {
  let fixture: ComponentFixture<SettingsPageComponent>;
  let component: SettingsPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SettingsPageComponent] }).compileComponents();
    fixture   = TestBed.createComponent(SettingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('activeTab defaults to "review"', () => {
    expect(component.activeTab()).toBe('review');
  });

  it('[data-review-tab] is visible by default', () => {
    expect(fixture.nativeElement.querySelector('[data-review-tab]')).not.toBeNull();
  });

  it('clicking notifications tab button sets activeTab to "notifications"', () => {
    const btn = fixture.nativeElement.querySelector('[data-tab-btn="notifications"]') as HTMLElement;
    btn.click();
    fixture.detectChanges();
    expect(component.activeTab()).toBe('notifications');
  });

  it('[data-notifications-tab] visible after switching to notifications', () => {
    component.activeTab.set('notifications');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-notifications-tab]')).not.toBeNull();
  });

  it('[data-evidence-tab] visible after switching to evidence', () => {
    component.activeTab.set('evidence');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-evidence-tab]')).not.toBeNull();
  });

  it('notifyReviewLaunch toggles correctly', () => {
    const initial = component.notifyReviewLaunch();
    component.notifyReviewLaunch.set(!initial);
    expect(component.notifyReviewLaunch()).toBe(!initial);
  });

  it('onSave() logs to console without throwing', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => component.onSave()).not.toThrow();
    spy.mockRestore();
  });
});
