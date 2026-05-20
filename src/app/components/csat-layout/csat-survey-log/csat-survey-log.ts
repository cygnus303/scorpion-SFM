import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-csat-survey-log',
  imports: [CommonModule, NgSelectModule],
  templateUrl: './csat-survey-log.html',
  styleUrl: './csat-survey-log.scss',
})
export class CsatSurveyLog {
  public surveys = [
    { id: 'S001', account: 'Reliance Freight', email: 'r.sharma@reliancefreight.com', contact: 'Mr. R. Sharma', trigger: 'Post-Delivery Survey', sentBy: 'Manoj Kumar', sentOn: '2025-04-06', status: 'Responded', score: 5, q2: 5, q3: 5, q4: 5, nps: 10, comments: 'Excellent service! Always on time.', color: '#16A34A' },
    { id: 'S002', account: 'BlueDart Corp', email: 'nisha.patel@bluedart.com', contact: 'Ms. Nisha Patel', trigger: 'Monthly Account Review', sentBy: 'Manoj Kumar', sentOn: '2025-04-05', status: 'Responded', score: 3, q2: 3, q3: 2, q4: 3, nps: 5, comments: 'Delivery was late twice. Communication needs improvement.', color: '#D97706' },
    { id: 'S003', account: 'Nexus Logistics', email: 'arun.singh@nexuslog.com', contact: 'Mr. Arun Singh', trigger: 'Post-Delivery Survey', sentBy: 'Manoj Kumar', sentOn: '2025-04-05', status: 'Responded', score: 4, q2: 4, q3: 4, q4: 5, nps: 8, comments: 'Good service overall, minor delays on pickups.', color: '#2563EB' },
    { id: 'S004', account: 'GlobalPack Ltd', email: 'vikram.g@globalpack.com', contact: 'Mr. Vikram G.', trigger: 'Post-Complaint Resolution', sentBy: 'Manoj Kumar', sentOn: '2025-04-03', status: 'Responded', score: 1, q2: 2, q3: 1, q4: 1, nps: 1, comments: 'Package was damaged. No follow-up in 10 days.', color: '#CC0000' },
    { id: 'S005', account: 'Sunrise Traders', email: 'sunita.r@sunrisetraders.com', contact: 'Ms. Sunita R.', trigger: 'Monthly Account Review', sentBy: 'Manoj Kumar', sentOn: '2025-04-02', status: 'Pending', score: null, color: '#CC0000' },
    { id: 'S006', account: 'IndoFreight Ltd', email: 'riya.shah@indofreight.com', contact: 'Ms. Riya Shah', trigger: 'Post-Delivery Survey', sentBy: 'Manoj Kumar', sentOn: '2025-04-01', status: 'Responded', score: 5, q2: 5, q3: 4, q4: 5, nps: 9, comments: 'Fantastic partner. Always reliable.', color: '#2563EB' },
    { id: 'S007', account: 'Apex Cargo', email: 'suresh.k@apexcargo.com', contact: 'Mr. Suresh K.', trigger: 'Post-Onboarding', sentBy: 'Manoj Kumar', sentOn: '2025-03-28', status: 'Responded', score: 4, q2: 4, q3: 4, q4: 4, nps: 7, comments: '', color: '#D97706' },
    { id: 'S008', account: 'SkyBridge Logistics', email: 'nisha.r@skybridge.com', contact: 'Ms. Nisha R.', trigger: 'Ad-hoc / Manual', sentBy: 'Manoj Kumar', sentOn: '2025-03-20', status: 'Expired', score: null, color: '#CC0000' },
  ]
}
