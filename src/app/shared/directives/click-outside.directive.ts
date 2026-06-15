import {
  Directive,
  ElementRef,
  EventEmitter,
  Output,
  inject,
  HostListener,
} from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  private el = inject(ElementRef<HTMLElement>);
  @Output() appClickOutside = new EventEmitter<void>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.appClickOutside.emit();
    }
  }
}
