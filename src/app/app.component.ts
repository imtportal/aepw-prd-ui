import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { ToastModule } from 'primeng/toast';
import { CurrentUserService } from './core/services/current-user.service';
import { AuthService } from './core/auth/services/auth.service';
import { take } from 'rxjs';
import { ToastComponent } from "./shared/ui/toast/toast.component";
import { UnsavedChangesService } from './core/services/unsaved-changes.service';
import { DialogComponent } from "./shared/ui/dialog/dialog.component";
import { ButtonComponent } from './shared/ui/button/button.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, DialogComponent,ButtonComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly currentUserService = inject(CurrentUserService);
  readonly unsavedChangesService = inject(UnsavedChangesService);
  onUnsavedChangesDialogClosed(): void {
    this.unsavedChangesService.stay();
  }
  ngOnInit(): void {
    // Only fetch the backend user record once MSAL has confirmed authentication.
    // auth.isAuthenticated() is set synchronously in AuthService.constructor()
    // via syncAccountFromMsal(), so this guard is safe during ngOnInit.
    if (this.auth.isAuthenticated()) {
      this.currentUserService.getCurrentUser().pipe(take(1)).subscribe();
    }
  }
}
