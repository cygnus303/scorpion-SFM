import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CSLevelDashboard } from './cslevel-dashboard';

describe('CSLevelDashboard', () => {
  let component: CSLevelDashboard;
  let fixture: ComponentFixture<CSLevelDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CSLevelDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(CSLevelDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
