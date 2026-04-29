import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseApproval } from './expense-approval';

describe('ExpenseApproval', () => {
  let component: ExpenseApproval;
  let fixture: ComponentFixture<ExpenseApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseApproval],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
