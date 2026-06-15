import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (item == null) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  }

  set(key: string, value: unknown): void {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
