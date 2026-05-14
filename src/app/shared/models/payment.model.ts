
export interface PaymentResponse {
    createdBy: string,
    requestID: string,
    approvedAmt: number,
    utrNo: string,
    utrDate: number,
    totalCount: number,
    selected: boolean
}