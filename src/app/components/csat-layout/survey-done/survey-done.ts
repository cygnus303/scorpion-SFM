import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-survey-done',
  imports: [CommonModule],
  templateUrl: './survey-done.html',
  styleUrl: './survey-done.scss',
})
export class SurveyDone {
    status: string = 'success';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.status = this.route.snapshot.queryParams['status'] || 'success';
  }
}
