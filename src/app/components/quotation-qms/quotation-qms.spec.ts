import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotationQMS } from './quotation-qms';

describe('QuotationQMS', () => {
  let component: QuotationQMS;
  let fixture: ComponentFixture<QuotationQMS>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotationQMS],
    }).compileComponents();

    fixture = TestBed.createComponent(QuotationQMS);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
