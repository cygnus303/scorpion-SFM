import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsatSurveyLog } from './csat-survey-log';

describe('CsatSurveyLog', () => {
  let component: CsatSurveyLog;
  let fixture: ComponentFixture<CsatSurveyLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsatSurveyLog],
    }).compileComponents();

    fixture = TestBed.createComponent(CsatSurveyLog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
