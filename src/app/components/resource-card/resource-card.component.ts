import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  templateUrl: './resource-card.component.html',
  styleUrl: './resource-card.component.css'
})
export class ResourceCardComponent {
  @Input() title = '';
  @Input() type: 'official' | 'non-official' = 'official';
  @Input() description = '';
  @Input() uploadedBy = '';
  @Input() date = '';
  @Input() showDelete = false;

  @Output() viewClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
}
