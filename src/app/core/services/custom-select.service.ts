import { Injectable, NgZone, inject } from '@angular/core';

interface Enhanced {
  select: HTMLSelectElement;
  trigger: HTMLButtonElement;
  label: HTMLSpanElement;
  /** Last rendered state, so sync() only touches the DOM when something changed. */
  key: string;
}

/**
 * Replaces the browser's native dropdown with one consistent custom dropdown everywhere.
 *
 * Every <select> keeps working exactly as before (ngModel, [value], (change), disabled,
 * dynamic options): it is only hidden, and a styled button + list is placed next to it.
 * Picking an option sets the real select and dispatches `input` + `change` on it.
 * Opt out per element with the `data-native` attribute. Multi-selects are left alone.
 */
@Injectable({ providedIn: 'root' })
export class CustomSelectService {
  private readonly zone = inject(NgZone);
  private readonly items = new Map<HTMLSelectElement, Enhanced>();
  private started = false;

  private menu: HTMLDivElement | null = null;
  private current: Enhanced | null = null;
  private active = -1;

  start(): void {
    if (this.started || typeof document === 'undefined') return;
    this.started = true;

    this.zone.runOutsideAngular(() => {
      const scan = (root: ParentNode) =>
        root.querySelectorAll('select').forEach((s) => this.enhance(s as HTMLSelectElement));
      scan(document);

      new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((n) => {
            if (n instanceof HTMLSelectElement) this.enhance(n);
            else if (n instanceof Element) scan(n);
          });
        }
        this.sync();
      }).observe(document.body, { childList: true, subtree: true });

      document.addEventListener(
        'mousedown',
        (e) => {
          const t = e.target as Node;
          if (this.menu && !this.menu.contains(t) && !this.current?.trigger.contains(t)) this.close();
        },
        true
      );
      window.addEventListener('resize', () => this.close());
      window.addEventListener(
        'scroll',
        (e) => {
          if (this.menu && !this.menu.contains(e.target as Node)) this.close();
        },
        true
      );
    });

    // Values set by ngModel / [value] / [selected] are properties, which nothing observes,
    // so re-read them after every change-detection turn (cheap: a few string compares).
    this.zone.onStable.subscribe(() => this.sync());
  }

  // —— Enhancing ——————————————————————————————————————————————

  private enhance(select: HTMLSelectElement): void {
    if (this.items.has(select) || select.multiple || select.size > 1 || select.hasAttribute('data-native')) return;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = `${select.className} cs-trigger`;
    trigger.style.cssText = select.style.cssText;
    if (select.hasAttribute('data-allow')) trigger.setAttribute('data-allow', '');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const ariaLabel = select.getAttribute('aria-label');
    if (ariaLabel) trigger.setAttribute('aria-label', ariaLabel);

    const label = document.createElement('span');
    label.className = 'cs-label';
    trigger.appendChild(label);

    select.style.setProperty('display', 'none', 'important');
    select.after(trigger);

    const entry: Enhanced = { select, trigger, label, key: '\u0000' };
    this.items.set(select, entry);

    trigger.addEventListener('click', () => (this.current === entry ? this.close() : this.open(entry)));
    trigger.addEventListener('keydown', (e) => this.onKey(e, entry));
    this.render(entry);
  }

  private cleanup(entry: Enhanced): void {
    if (this.current === entry) this.close();
    entry.trigger.remove();
    this.items.delete(entry.select);
  }

  private stateKey(select: HTMLSelectElement): string {
    const opt = select.options[select.selectedIndex];
    return `${opt ? opt.text : ''}|${select.disabled}|${select.options.length}|${select.selectedIndex}`;
  }

  private render(entry: Enhanced): void {
    const { select, trigger, label } = entry;
    const opt = select.options[select.selectedIndex];
    const text = opt ? opt.text.trim() : '';
    label.textContent = text || ' ';
    label.classList.toggle('cs-placeholder', !!opt && opt.value === '');
    trigger.disabled = select.disabled;
    entry.key = this.stateKey(select);
  }

  /** Keep every trigger in step with its real select; drop triggers whose select is gone. */
  private sync(): void {
    for (const entry of [...this.items.values()]) {
      if (!entry.select.isConnected) {
        this.cleanup(entry);
        continue;
      }
      const key = this.stateKey(entry.select);
      if (key !== entry.key) {
        this.render(entry);
        if (this.current === entry && this.menu) this.fillMenu(entry);
      }
    }
  }

  // —— Menu ———————————————————————————————————————————————————

  private open(entry: Enhanced): void {
    if (entry.select.disabled) return;
    this.close();
    this.current = entry;
    const menu = document.createElement('div');
    menu.className = 'cs-menu';
    menu.setAttribute('role', 'listbox');
    document.body.appendChild(menu);
    this.menu = menu;
    this.active = entry.select.selectedIndex;
    this.fillMenu(entry);
    this.position(entry, menu);
    entry.trigger.setAttribute('aria-expanded', 'true');
  }

  private fillMenu(entry: Enhanced): void {
    const menu = this.menu;
    if (!menu) return;
    menu.textContent = '';
    const { select } = entry;
    Array.from(select.options).forEach((opt, i) => {
      if (opt.hidden) return;
      const row = document.createElement('div');
      row.className = 'cs-opt';
      row.setAttribute('role', 'option');
      row.dataset['i'] = String(i);
      const selected = i === select.selectedIndex;
      row.setAttribute('aria-selected', String(selected));
      if (selected) row.classList.add('cs-selected');
      if (opt.disabled) row.classList.add('cs-disabled');
      if (i === this.active) row.classList.add('cs-active');

      const text = document.createElement('span');
      text.textContent = opt.text.trim() || ' ';
      row.appendChild(text);
      if (selected) {
        const tick = document.createElement('span');
        tick.className = 'cs-tick';
        tick.textContent = '✓';
        row.appendChild(tick);
      }
      row.addEventListener('mousemove', () => this.setActive(i, false));
      row.addEventListener('click', () => this.choose(entry, i));
      menu.appendChild(row);
    });
    this.scrollActiveIntoView();
  }

  private position(entry: Enhanced, menu: HTMLElement): void {
    const r = entry.trigger.getBoundingClientRect();
    menu.style.minWidth = `${Math.max(r.width, 140)}px`;
    const height = Math.min(menu.scrollHeight, 288);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < height + 12 && r.top > spaceBelow;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8));
    menu.style.left = `${left}px`;
    menu.style.top = `${openUp ? Math.max(8, r.top - height - 6) : r.bottom + 6}px`;
  }

  private choose(entry: Enhanced, index: number): void {
    const { select } = entry;
    const opt = select.options[index];
    if (!opt || opt.disabled) return;
    const changed = select.selectedIndex !== index;
    if (changed) {
      select.selectedIndex = index;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    this.close();
    entry.trigger.focus();
    this.render(entry);
  }

  private close(): void {
    if (this.menu) this.menu.remove();
    this.menu = null;
    if (this.current) this.current.trigger.setAttribute('aria-expanded', 'false');
    this.current = null;
  }

  // —— Keyboard ———————————————————————————————————————————————

  private onKey(e: KeyboardEvent, entry: Enhanced): void {
    const open = this.current === entry && !!this.menu;
    const count = entry.select.options.length;

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        this.open(entry);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.step(entry, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.step(entry, -1);
        break;
      case 'Home':
        e.preventDefault();
        this.setActive(this.firstEnabled(entry, 0, 1), true);
        break;
      case 'End':
        e.preventDefault();
        this.setActive(this.firstEnabled(entry, count - 1, -1), true);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.choose(entry, this.active);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) this.typeAhead(entry, e.key);
    }
  }

  private firstEnabled(entry: Enhanced, from: number, dir: 1 | -1): number {
    const opts = entry.select.options;
    for (let i = from; i >= 0 && i < opts.length; i += dir) if (!opts[i].disabled) return i;
    return this.active;
  }

  private step(entry: Enhanced, dir: 1 | -1): void {
    const opts = entry.select.options;
    let i = this.active;
    do {
      i += dir;
    } while (i >= 0 && i < opts.length && opts[i].disabled);
    if (i >= 0 && i < opts.length) this.setActive(i, true);
  }

  private typeAhead(entry: Enhanced, ch: string): void {
    const opts = Array.from(entry.select.options);
    const start = this.active + 1;
    const ordered = [...opts.slice(start), ...opts.slice(0, start)];
    const hit = ordered.find((o) => !o.disabled && o.text.trim().toLowerCase().startsWith(ch.toLowerCase()));
    if (hit) this.setActive(opts.indexOf(hit), true);
  }

  private setActive(index: number, scroll: boolean): void {
    if (!this.menu || index === this.active) return;
    this.active = index;
    this.menu.querySelectorAll('.cs-opt').forEach((row) => {
      row.classList.toggle('cs-active', (row as HTMLElement).dataset['i'] === String(index));
    });
    if (scroll) this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    const row = this.menu?.querySelector('.cs-active') as HTMLElement | null;
    row?.scrollIntoView({ block: 'nearest' });
  }
}
