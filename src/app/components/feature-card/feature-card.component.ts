import { Component, Input, inject, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-feature-card',
  standalone: true,
  templateUrl: './feature-card.component.html',
  styleUrl: './feature-card.component.css'
})
export class FeatureCardComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);
  @Input() icon = '';
  @Input() title = '';
  @Input() description = '';
  safeIcon: SafeHtml = '';

  ngOnChanges(): void {
    this.safeIcon = this.sanitizer.bypassSecurityTrustHtml(this.icon);
  }
}
