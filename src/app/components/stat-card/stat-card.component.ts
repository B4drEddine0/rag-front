import { Component, Input, inject, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css'
})
export class StatCardComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() icon = '';
  @Input() color = '#2563eb';
  safeIcon: SafeHtml = '';

  ngOnChanges(): void {
    this.safeIcon = this.sanitizer.bypassSecurityTrustHtml(this.icon);
  }
}
