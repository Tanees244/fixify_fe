import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EntityIdRegistry {
  private readonly clientApiToLocal = new Map<string, number>();
  private readonly websiteApiToLocal = new Map<string, number>();
  private nextClientId = 1;
  private nextSiteId = 1;

  reset(): void {
    this.clientApiToLocal.clear();
    this.websiteApiToLocal.clear();
    this.nextClientId = 1;
    this.nextSiteId = 1;
  }

  clientLocalId(apiId: string): number {
    if (!this.clientApiToLocal.has(apiId)) {
      this.clientApiToLocal.set(apiId, this.nextClientId++);
    }
    return this.clientApiToLocal.get(apiId)!;
  }

  clientApiId(localId: number): string | undefined {
    for (const [apiId, local] of this.clientApiToLocal) {
      if (local === localId) return apiId;
    }
    return undefined;
  }

  websiteLocalId(apiId: string): number {
    if (!this.websiteApiToLocal.has(apiId)) {
      this.websiteApiToLocal.set(apiId, this.nextSiteId++);
    }
    return this.websiteApiToLocal.get(apiId)!;
  }

  websiteApiId(localId: number): string | undefined {
    for (const [apiId, local] of this.websiteApiToLocal) {
      if (local === localId) return apiId;
    }
    return undefined;
  }
}
