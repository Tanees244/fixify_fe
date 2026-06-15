import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent, NavItem } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, NavbarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50">
      <!-- Sidebar -->
      <app-sidebar [isOpen]="sidebarOpen" [navItems]="navItems" />

      <!-- Main Content Area -->
      <div
        class="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        [class.ml-64]="sidebarOpen"
        [class.ml-20]="!sidebarOpen"
      >
        <!-- Navbar -->
        <app-navbar (sidebarToggle)="toggleSidebar()" />

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto pt-16 p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }
    `,
  ],
})
export class LayoutComponent {
  sidebarOpen = true;
  
  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/', icon: '📊' },
    { label: 'Users', route: '/users', icon: '👥' },
    { label: 'Settings', route: '/settings', icon: '⚙️' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
