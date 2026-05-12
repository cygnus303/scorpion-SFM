import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddPrq } from './add-prq/add-prq';
import { PrqService } from '../../shared/services/prq-service';
import { CommonService } from '../../shared/services/common.service';
import { Subject, takeUntil } from 'rxjs';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pickup-request-list',
  imports: [CommonModule, AddPrq,PaginationModule,FormsModule],
  templateUrl: './pickup-request-list.html',
  styleUrl: './pickup-request-list.scss',
})
export class PickupRequestList {
  public PRQCard: any[] = [];
  public PRQList:any[]=[];
  public totalItems: number = 0;
  private destroy$ = new Subject<void>();
  @ViewChild('addPRQ') addPRQ!: AddPrq;

  constructor(
    private PRQService: PrqService,
    public commonService: CommonService
  ) { }

  ngOnInit() {
     this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
       this.getPRQCardList();
     this.getPRQList()
        });

  }

  selectPrqType(type: string) {
    this.addPRQ.showPopup(type);
  }

  getPRQCardList() {
    const payload = {
      "fromDate": this.commonService.globalFilters.startDate,
      "toDate": this.commonService.globalFilters.endDate,
      "updateBy": this.commonService.globalFilters.UserID.toString(),
      "location": null,
      "type": "N"
    }
    this.PRQService.getPRQCard(payload).subscribe((response: any) => {
      this.PRQCard = response.data;
    });
  }

  getPRQList(){
     const payload = {
      "fromDate": this.commonService.globalFilters.startDate,
      "toDate": this.commonService.globalFilters.endDate,
      "updateBy": this.commonService.globalFilters.UserID.toString(),
      "location": null,
      "type": "N"
    }
    this.PRQService.getPRQList(payload).subscribe((response: any) => {
      this.PRQList = response.data;
      this.totalItems=response.totalCount
    });
  }

  //   onPageChange(event: any): void {
  //   this.getPRQList(event.page);
  // }


}
