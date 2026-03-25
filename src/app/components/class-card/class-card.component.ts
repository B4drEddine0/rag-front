import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-class-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './class-card.component.html',
  styleUrl: './class-card.component.css'
})
export class ClassCardComponent {
  @Input() classId = '';
  @Input() name = '';
  @Input() grade = '';
  @Input() studentsCount = 0;
  @Input() teachersCount = 0;
  @Input() resourcesCount = 0;
  @Input() showAdminActions = false;
  @Input() showDetailsAction = true;

  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();

  onEdit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.editClicked.emit();
  }

  onDelete(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.deleteClicked.emit();
  }
}
