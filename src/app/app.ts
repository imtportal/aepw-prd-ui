import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CurrentUserService } from './core/services/current-user.service';
import { DialogComponent } from './shared/ui/dialog/dialog.component';
import { ButtonComponent } from './shared/ui/button/button.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogComponent, ButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {

  protected readonly title = signal('aepw-angular');

  private currentUserService = inject(CurrentUserService);

  ngOnInit(): void {
    this.currentUserService.getCurrentUser();
  }
}
