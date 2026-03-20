import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ViewStateService } from '../../core/services/view-state.service';
import { SchoolClass, Student } from '../../shared/models/class.model';
import { Resource } from '../../shared/models/resource.model';

@Component({
  selector: 'app-class-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './class-details.component.html',
  styleUrl: './class-details.component.css'
})
export class ClassDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly viewState = inject(ViewStateService);

  classId = 0;

  get schoolClass(): SchoolClass | undefined {
    return this.viewState.classDetails()[this.classId]?.schoolClass;
  }

  get students(): Student[] {
    return this.viewState.classDetails()[this.classId]?.students ?? [];
  }

  get resources(): Resource[] {
    return this.viewState.classDetails()[this.classId]?.resources ?? [];
  }

  get loading(): boolean {
    return this.viewState.classDetails()[this.classId]?.loading ?? true;
  }

  get error(): string {
    return this.viewState.classDetails()[this.classId]?.error ?? '';
  }

  ngOnInit(): void {
    this.classId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.classId) {
      this.viewState.classDetails.update(prev => ({
        ...prev,
        0: { loading: false, error: 'Invalid class id.', students: [], resources: [] }
      }));
      return;
    }

    this.viewState.loadClassDetails(this.classId, true);
  }
}
