import { Component, Input, inject, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-step-card',
  standalone: true,
  templateUrl: './step-card.component.html',
  styleUrl: './step-card.component.css'
})
export class StepCardComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);
  @Input() stepNumber = 1;
  @Input() icon = '';
  @Input() title = '';
  @Input() description = '';
  safeIcon: SafeHtml = '';

  ngOnChanges(): void {
    this.safeIcon = this.sanitizer.bypassSecurityTrustHtml(this.icon);
  }
}
