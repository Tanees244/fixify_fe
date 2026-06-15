import { Component, inject, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { User } from '../../../core/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  template: `
    <header class="fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-6">
      <!-- Left: Toggle Sidebar Button -->
      <button
        (click)="toggleSidebar()"
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle sidebar"
      >
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Right: User Menu -->
      <div class="flex items-center gap-4">
        <!-- Notifications -->
        <button
          class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <!-- User Dropdown -->
        <div class="relative" appClickOutside (appClickOutside)="closeDropdown()">
          <button
            (click)="toggleDropdown()"
            class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="User menu"
          >
            <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-semibold">{{ getUserInitials() }}</span>
            </div>
            <div class="hidden md:block text-left">
              <p class="text-sm font-medium text-gray-800">{{ getUserEmail() }}</p>
              <p class="text-xs text-gray-500">User</p>
            </div>
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          @if (isDropdownOpen) {
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              <a
                href="#"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                (click)="navigateToProfile($event)"
              >
                Profile
              </a>
              <a
                href="#"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                (click)="navigateToSettings($event)"
              >
                Settings
              </a>
              <hr class="my-2 border-gray-200" />
              <button
                (click)="logout()"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  @Output() sidebarToggle = new EventEmitter<void>();
  
  isDropdownOpen = false;
  sidebarOpen = true;

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarToggle.emit();
  }

  getUserEmail(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || 'user@example.com';
  }

  getUserInitials(): string {
    const user = this.authService.getCurrentUser();
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    const email = this.getUserEmail();
    return email.charAt(0).toUpperCase();
  }

  navigateToProfile(event: Event): void {
    event.preventDefault();
    this.closeDropdown();
    this.router.navigate(['/profile']);
  }

  navigateToSettings(event: Event): void {
    event.preventDefault();
    this.closeDropdown();
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.closeDropdown();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
