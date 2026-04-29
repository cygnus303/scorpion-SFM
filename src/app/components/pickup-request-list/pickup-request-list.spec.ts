import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickupRequestList } from './pickup-request-list';

describe('PickupRequestList', () => {
  let component: PickupRequestList;
  let fixture: ComponentFixture<PickupRequestList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PickupRequestList],
    }).compileComponents();

    fixture = TestBed.createComponent(PickupRequestList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
