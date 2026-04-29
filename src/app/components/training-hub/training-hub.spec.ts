import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingHub } from './training-hub';

describe('TrainingHub', () => {
  let component: TrainingHub;
  let fixture: ComponentFixture<TrainingHub>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingHub],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingHub);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
