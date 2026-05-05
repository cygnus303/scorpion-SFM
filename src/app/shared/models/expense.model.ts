export interface ExpenseResponse {
  expenseId: string;
  expenseCreated: boolean;
  expenseCode: string;
  expenseDate: string;
  expenseRate: number;
  amount: number;
  status: string;
  totalCount: number;
  meetingId: string;
  createdBy: string;
  attendeeIDs: string;
  attendeeName: string;
  leadId: string;
  companyName: string;
  meetingLat: number;
  meetingLng: number;
  checkIn: string;
  checkOut: string;
  distanceTravelled: number;
  requestID: string;
  requestDate: string;
  meetingDate: string;
  isApproved: boolean;
  approvedBy: string;
  approvedDate: string;
  isAuditApproved: boolean;
  auditedBy: string;
  auditDate: string;
  auditRemarks: string;
  expenseAddedDate: string;
  expenseAddedTime: string;
  expenseModifiedDate: string;
  expenseModifiedTime: string;
  adminApproved: boolean;
  managerApproved: boolean;
  isEdit: string;
  managerRemark: string;
  auditRemark: string;
  expenseAddedBy: string;
  expenseEditedBy: string;
  expensEditDate: string;
  approveByManagerName: string;
  approvedManagerDate: string;
  approvedByAuditorName: string;
  approvedByAuditDate: string;
  exp_Status: number;
  attendeeCode: string;
  requestIdDate: string;
  rtgsNo: string;
  utrNo: string;
  showActions?: boolean;
}

export interface ExpenseDetailResponse extends ExpenseResponse {
  punchedInLocation?: string;
  checkedInLocation?: string;
  checkedOutLocation?: string;
  distanceInKm?: number;
  supportingDocument?: string;
  remarks?: string;
  customerName?: string;
  transportMode?: string;
  designation?: string;
  ratePerKM?: number;
  createdDate?: string;

  modifiedBy?: string;
  modifiedDate?: string;
  transportModeId?: string;
  meetingMOM?: string;
  utrDate?: string;
}

export interface AddExpenseRequest {
  meetingId: string;
  transportModeId: number;
  expenseDate: Date;
  punchInLocation: string;
  checkedInLocation: string;
  distanceInKm: number;
  supportingDocument: string;
  createdBy: string;
  UserId: string;
  modifiedBy: string;
  amount: number;
  file: string;
  remarks: string;
}


