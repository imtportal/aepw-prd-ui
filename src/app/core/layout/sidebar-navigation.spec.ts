import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthStateService } from '../auth';
import { AuthService } from '../auth/services/auth.service';
import { PageLoadingService } from '../services/page-loading.service';
import { ProjectLibraryCacheService } from '../../features/workflow/project library/services/project-library-cache.service';
import { SidebarComponent } from './sidebar.component';

describe('Sidebar Project Library navigation', () => {
  const resetPreferences = vi.fn();

  beforeEach(() => {
    resetPreferences.mockClear();
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: {} },
        { provide: AuthStateService, useValue: {} },
        { provide: PageLoadingService, useValue: { start: vi.fn() } },
        { provide: ProjectLibraryCacheService, useValue: { resetPreferences } },
      ],
    });
  });

  it.each(['/workflow/dashboard', '/admin/projects-info/123', '/workflow/projectLibrary'])(
    'resets preferences when clicking Project Library from %s',
    (activeUrl) => {
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.componentRef.setInput('activeUrl', activeUrl);

      fixture.componentInstance['onMenuItemClick']('/workflow/projectLibrary');

      expect(resetPreferences).toHaveBeenCalledOnce();
    },
  );

  it('does not reset Project Library preferences for another menu item', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.componentRef.setInput('activeUrl', '/workflow/projectLibrary');

    fixture.componentInstance['onMenuItemClick']('/workflow/dashboard');

    expect(resetPreferences).not.toHaveBeenCalled();
  });
});
