import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, TemplateRef, ViewChild, inject } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { IdentityService } from '../../../shared/services/identity.service';
import { GeneralMaster } from '../../../shared/models/expenseGeneral.model';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-add-expense-general-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './add-expense-general-master.html',
  styleUrl: './add-expense-general-master.scss',
})
export class AddExpenseGeneralMaster {
  public modalRef!: BsModalRef;
  public type: string = '';
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;

  expenseMasterForm!: FormGroup;
  transportModes: GeneralMaster[] = [];
  designationList: GeneralMaster[] = [];

  @Output() dataEmitter: EventEmitter<string> = new EventEmitter<string>();
  public isSubmitting: boolean = false;
  public modalService = inject(BsModalService);
  private sweetAlertService = inject(SweetAlertService);
  private expenseGeneralService = inject(ExpenseGeneralService);
  private identityService = inject(IdentityService);

  showPopup(data: any) {
    this.type = data ? 'Update Expense' : 'Add Expense';

    this.buildForm();
    this.getTransportModes();
    this.getDesignationList();

    if (this.expenseMasterForm) {
      if (data) {
        this.expenseMasterForm.patchValue({
          transportModeId: data.transportModeId?.toString() || null,
          designationId: data.designationId?.toString() || null,
          ratePerKM: data.ratePerKM,
          id: data.id,
          modifiedBy: data.modifiedBy,
          active: data.isActive,
        });
      } else {
        this.expenseMasterForm.reset({ active: true, id: 0 });
      }
    }
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
  }

  buildForm(): void {
    this.expenseMasterForm = new FormGroup({
      transportModeId: new FormControl(null, [Validators.required]),
      designationId: new FormControl(null, [Validators.required]),
      ratePerKM: new FormControl('', [Validators.required]),
      id: new FormControl(0),
      createdBy: new FormControl(''),
      modifiedBy: new FormControl(''),
      active: new FormControl(true),
    });
  }

  onClose() {
    this.expenseMasterForm?.reset();
    if (this.expenseMasterForm) {
      this.buildForm();
    }
    this.modalRef?.hide();
  }

  getDesignationList(searchText: string | null = null) {
    this.expenseGeneralService.getGeneralMaster(searchText, 'DESIG').subscribe({
      next: (response: any) => {
        if (response) {
          this.designationList = response.data;
        }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
    });
  }

  getTransportModes(searchText: string | null = null) {
    this.expenseGeneralService.getGeneralMaster(searchText, 'SERCAT').subscribe({
      next: (response: any) => {
        if (response) {
          this.transportModes = response.data;
        }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
    });
  }

  onSubmitExpense(form: FormGroup): void {
    if (form.valid) {
      this.isSubmitting = true;
      const data = {
        ...this.expenseMasterForm.value,
        transportModeId: parseInt(this.expenseMasterForm.value.transportModeId),
        designationId: parseInt(this.expenseMasterForm.value.designationId),
        ratePerKM: parseInt(this.expenseMasterForm.value.ratePerKM),
        createdBy: this.identityService.getLoggedUserId(),
      }
      !this.type ? this.addGeneral(data) : this.updateGeneral(data);
    } else {
      this.expenseMasterForm.markAllAsTouched();
    }
  }

  addGeneral(dataToSubmit: any): void {
    this.expenseGeneralService.addGeneralMaster(dataToSubmit).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.sweetAlertService.success(response.data.message || 'Added successfully');
          this.dataEmitter.emit();
          this.onClose();
        } else {
          this.sweetAlertService.error(response.error?.message || 'Failed to add');
        }
        this.isSubmitting = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response?.error?.message || 'Error occurred');
        this.isSubmitting = false;
      },
    });
  }

  updateGeneral(dataToSubmit: any): void {
    this.expenseGeneralService.updateGeneralMaster(dataToSubmit).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.sweetAlertService.success(response.data.message || 'Updated successfully');
          this.dataEmitter.emit();
          this.onClose();
        } else {
          this.sweetAlertService.error(response.error?.message || 'Failed to update');
        }
        this.isSubmitting = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response?.error?.message || 'Error occurred');
        this.isSubmitting = false;
      },
    });
  }
}
