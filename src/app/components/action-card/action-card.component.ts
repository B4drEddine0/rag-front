import { Component, Input, inject, OnChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-action-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './action-card.component.html',
  styleUrl: './action-card.component.css'
})
export class ActionCardComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);
  @Input() icon = '';
  @Input() label = '';
  @Input() route = '/';
  safeIcon: SafeHtml = '';

  ngOnChanges(): void {
    this.safeIcon = this.sanitizer.bypassSecurityTrustHtml(this.icon);
  }
}
