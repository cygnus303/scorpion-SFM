import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseGeneralMaster } from './expense-general-master';

describe('ExpenseGeneralMaster', () => {
  let component: ExpenseGeneralMaster;
  let fixture: ComponentFixture<ExpenseGeneralMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseGeneralMaster],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseGeneralMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
