import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsDatepickerModule, BsDaterangepickerConfig } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, BsDatepickerModule],
  template: `
    <button
      type="button"
      class="tbtn"
      [id]="id"
      bsDaterangepicker
      [bsConfig]="bsConfig"
      (bsValueChange)="onDateChange($event)"
    >
      <span class="calendar-icon">📅</span>
    </button>
  `,
  styles: [`
    .tbtn {
      padding: 6px 14px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      background: var(--red, #CC0000);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      &:hover {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    .calendar-icon {
      font-size: 16px;
    }
  `]
})
export class DateRangePickerComponent {
  @Input() id: string = 'topbar-action';
  @Output() dateSelected = new EventEmitter<Date[]>();

  bsConfig: Partial<BsDaterangepickerConfig> = {
    containerClass: 'theme-red',
    rangeInputFormat: 'DD/MM/YYYY',
    showWeekNumbers: false,
    displayMonths: 2,
    adaptivePosition: true,
    ranges: [
      {
        value: [new Date(), new Date()],
        label: 'Today'
      },
      {
        value: [new Date(new Date().setDate(new Date().getDate() - 1)), new Date(new Date().setDate(new Date().getDate() - 1))],
        label: 'Yesterday'
      },
      {
        value: [new Date(new Date().setDate(new Date().getDate() - 7)), new Date()],
        label: 'Last 7 Days'
      },
      {
        value: [new Date(new Date().setDate(new Date().getDate() - 30)), new Date()],
        label: 'Last 30 Days'
      },
      {
        value: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()],
        label: 'This Month'
      },
      {
        value: [new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), new Date(new Date().getFullYear(), new Date().getMonth(), 0)],
        label: 'Last Month'
      }
    ]
  };

  onDateChange(dates: Date[] | any) {
    if (dates && Array.isArray(dates) && dates.length === 2) {
      this.dateSelected.emit(dates);
    }
  }
}
