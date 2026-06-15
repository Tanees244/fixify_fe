import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface NavItem {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside
      [class]="
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 ' +
        (isOpen ? 'w-64' : 'w-20')
      "
    >
      <div class="flex flex-col h-full">
        <!-- Logo/Brand -->
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="text-white font-bold text-lg">A</span>
            </div>
            @if (isOpen) {
              <h2 class="text-xl font-bold text-gray-800 whitespace-nowrap">My App</h2>
            }
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto p-4">
          <ul class="space-y-2">
            @for (item of navItems; track item.route) {
              <li>
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                  [routerLinkActiveOptions]="{ exact: item.route === '/' }"
                  class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  @if (item.icon) {
                    <span class="text-xl flex-shrink-0">{{ item.icon }}</span>
                  } @else {
                    <div class="w-5 h-5 flex-shrink-0"></div>
                  }
                  @if (isOpen) {
                    <span class="whitespace-nowrap">{{ item.label }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </nav>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  @Input() isOpen = true;
  @Input() navItems: NavItem[] = [
    { label: 'Dashboard', route: '/', icon: '📊' },
    { label: 'Users', route: '/users', icon: '👥' },
    { label: 'Settings', route: '/settings', icon: '⚙️' },
  ];
}
