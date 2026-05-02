export interface GeneralMasterResponse {
  codeId: string;
  codeDesc: string;
  codeType?: string;
}

export interface DocketResponse {
  bookingBranch: string;
  reassigN_DESTCD: string;
  dktStatus: string;
  partyName: string;
}
