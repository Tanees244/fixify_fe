import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CustomSelectService } from './core/services/custom-select.service';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-toast-container />
  `,
  styleUrl: './app.component.css',
})
export class AppComponent {
  constructor() {
    // Upgrades every <select> in the app to the shared custom dropdown.
    inject(CustomSelectService).start();
  }
}
