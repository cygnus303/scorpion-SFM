import { Component, EventEmitter, Input, Output, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsDatepickerModule, BsDaterangepickerConfig } from 'ngx-bootstrap/datepicker';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, BsDatepickerModule, FormsModule],
  template: `
    <div class="date-picker-container">
      <button
        type="button"
        class="tbtn"
        [id]="id"
        (click)="togglePicker($event)"
      >
        <span class="calendar-icon">📅</span>
      </button>

      <!-- Premium Custom Date Picker Dropdown -->
      <div class="custom-picker-dropdown" *ngIf="showPicker" (click)="$event.stopPropagation()" [@dropdownAnimation]>
        <div class="presets-section">
          <div class="preset-header">QUICK SELECT</div>
          <button *ngFor="let range of ranges" 
                  (click)="selectPreset(range)"
                  [class.active]="activeRangeLabel === range.label">
            <i [class]="range.icon" class="me-2"></i>
            {{ range.label }}
          </button>
        </div>

        <div class="custom-range-section">
          <div class="section-header">
            <span class="section-title">CUSTOM RANGE</span>
            <span class="range-info">Select start & end dates</span>
          </div>

          <div class="inputs-row">
            <div class="input-group-custom">
              <label>FROM</label>
              <div class="input-wrapper">
                <i class="ri-calendar-line"></i>
                <input type="text"
                       placeholder="DD/MM/YYYY"
                       class="form-control"
                       bsDatepicker
                       [(ngModel)]="tempStartDate"
                       [bsConfig]="datePickerConfig"
                       [readonly]="true"
                       (keydown)="$event.preventDefault()">
              </div>
            </div>
            <div class="arrow-divider">
              <i class="ri-arrow-right-line"></i>
            </div>
            <div class="input-group-custom">
              <label>TO</label>
              <div class="input-wrapper">
                <i class="ri-calendar-check-line"></i>
                <input type="text"
                       placeholder="DD/MM/YYYY"
                       class="form-control"
                       bsDatepicker
                       [(ngModel)]="tempEndDate"
                       [bsConfig]="datePickerConfig"
                       [readonly]="true"
                       (keydown)="$event.preventDefault()">
              </div>
            </div>
          </div>

          <div class="actions-row">
            <button class="btn-apply" (click)="applyCustomRange()">
              <i class="ri-check-line me-1"></i> Apply Range
            </button>
            <button class="btn-cancel" (click)="closePicker()">
              <i class="ri-close-line me-1"></i> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host {
      font-family: 'Inter', sans-serif;
    }

    .date-picker-container {
      position: relative;
      display: inline-block;
    }

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

      .calendar-icon {
        font-size: 16px;
      }
    }

    .custom-picker-dropdown {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: flex;
      flex-direction: row;
      min-width: 520px;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .presets-section {
      width: 180px;
      background: #fdf2f2;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-right: 1px solid #fee2e2;

      .preset-header {
        font-size: 10px;
        font-weight: 800;
        color: #b91c1c;
        letter-spacing: 1px;
        margin-bottom: 8px;
        padding-left: 8px;
        opacity: 0.7;
      }

      button {
        text-align: left;
        background: transparent;
        border: none;
        padding: 10px 14px;
        font-size: 13px;
        color: #7f1d1d;
        font-weight: 500;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;

        &:hover {
          background: #fee2e2;
          color: #ef4444;
          padding-left: 18px;
        }

        &.active {
          background: #ef4444;
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        }
      }
    }

    .custom-range-section {
      flex: 1;
      padding: 24px;
      background: white;
      display: flex;
      flex-direction: column;
      gap: 20px;

      .section-header {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: 4px;

        .section-title {
          font-size: 11px;
          font-weight: 800;
          color: #ef4444;
          letter-spacing: 0.8px;
        }
        .range-info {
          font-size: 12px;
          color: #64748b;
        }
      }
    }

    .inputs-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .arrow-divider {
      color: #fee2e2;
      margin-top: 20px;
      font-size: 1.1rem;
    }

    .input-group-custom {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 11px;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;

        i {
          position: absolute;
          left: 12px;
          color: #ef4444;
          font-size: 1rem;
          opacity: 0.6;
        }

        input {
          width: 100%;
          padding: 11px 12px 11px 38px;
          border: 1px solid #fee2e2;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
          transition: all 0.2s;
          background: #fef2f2;

          &:hover { border-color: #fca5a5; }
          &:focus { 
            border-color: #ef4444; 
            background: white;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            outline: none; 
          }
        }
      }
    }

    .actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 10px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;

      button {
        padding: 10px 24px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        border: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
      }

      .btn-apply {
        background: #ef4444;
        color: white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(239, 68, 68, 0.3);
          filter: brightness(1.1);
        }
      }

      .btn-cancel {
        background: #f1f5f9;
        color: #64748b;
        &:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
      }
    }
  `],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class DateRangePickerComponent {
  @Input() id: string = 'topbar-action';
  @Input() bsValue?: Date[];
  @Output() bsValueChange = new EventEmitter<Date[]>();
  @Output() dateSelected = new EventEmitter<Date[]>();

  showPicker = false;
  activeRangeLabel = '';
  tempStartDate: Date = new Date();
  tempEndDate: Date = new Date();

  datePickerConfig: Partial<BsDaterangepickerConfig> = {
    containerClass: 'theme-red',
    dateInputFormat: 'DD/MM/YYYY',
    showWeekNumbers: false,
    adaptivePosition: true
  };

  ranges = [
    { label: 'Today', icon: 'ri-time-line', value: [new Date(), new Date()] },
    { label: 'Yesterday', icon: 'ri-history-line', value: [new Date(new Date().setDate(new Date().getDate() - 1)), new Date(new Date().setDate(new Date().getDate() - 1))] },
    { label: 'Last 7 Days', icon: 'ri-calendar-check-line', value: [new Date(new Date().setDate(new Date().getDate() - 7)), new Date()] },
    { label: 'Last 30 Days', icon: 'ri-calendar-2-line', value: [new Date(new Date().setDate(new Date().getDate() - 30)), new Date()] },
    { label: 'This Month', icon: 'ri-calendar-todo-line', value: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] },
    { label: 'Last Month', icon: 'ri-calendar-event-line', value: [new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), new Date(new Date().getFullYear(), new Date().getMonth(), 0)] }
  ];

  constructor(private elementRef: ElementRef) { }

  ngOnChanges() {
    if (this.bsValue && this.bsValue.length === 2) {
      this.tempStartDate = new Date(this.bsValue[0]);
      this.tempEndDate = new Date(this.bsValue[1]);
      this.updateActiveRangeLabel();
    }
  }

  updateActiveRangeLabel() {
    if (!this.bsValue || this.bsValue.length !== 2) {
      this.activeRangeLabel = '';
      return;
    }

    const startStr = this.bsValue[0].toDateString();
    const endStr = this.bsValue[1].toDateString();

    const matchedRange = this.ranges.find(r => {
      const rangeStartStr = r.value[0].toDateString();
      const rangeEndStr = r.value[1].toDateString();
      return startStr === rangeStartStr && endStr === rangeEndStr;
    });

    this.activeRangeLabel = matchedRange ? matchedRange.label : 'Custom Range';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(target);
    const clickedOnPopup = target.closest('.bs-datepicker-container') || target.closest('.bs-calendar-container');

    if (!clickedInside && !clickedOnPopup) {
      this.showPicker = false;
    }
  }

  togglePicker(event: MouseEvent) {
    event.stopPropagation();
    this.showPicker = !this.showPicker;
    if (this.showPicker && this.bsValue && this.bsValue.length === 2) {
      this.tempStartDate = new Date(this.bsValue[0]);
      this.tempEndDate = new Date(this.bsValue[1]);
      this.updateActiveRangeLabel();
    }
  }

  openPicker() {
    this.showPicker = true;
    if (this.bsValue && this.bsValue.length === 2) {
      this.tempStartDate = new Date(this.bsValue[0]);
      this.tempEndDate = new Date(this.bsValue[1]);
      this.updateActiveRangeLabel();
    }
  }

  closePicker() {
    this.showPicker = false;
  }

  selectPreset(range: any) {
    this.activeRangeLabel = range.label;
    const start = new Date(range.value[0]);
    const end = new Date(range.value[1]);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const result = [start, end];
    this.dateSelected.emit(result);
    this.bsValueChange.emit(result);
    this.showPicker = false;
  }

  applyCustomRange() {
    if (!this.tempStartDate || !this.tempEndDate) return;

    const start = new Date(this.tempStartDate);
    const end = new Date(this.tempEndDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const result = [start, end];
    this.dateSelected.emit(result);
    this.bsValueChange.emit(result);
    this.activeRangeLabel = 'Custom Range';
    this.showPicker = false;
  }
}
