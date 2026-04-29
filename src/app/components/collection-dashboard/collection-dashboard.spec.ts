import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionDashboard } from './collection-dashboard';

describe('CollectionDashboard', () => {
  let component: CollectionDashboard;
  let fixture: ComponentFixture<CollectionDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
