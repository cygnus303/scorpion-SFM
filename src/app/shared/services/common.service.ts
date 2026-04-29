import { Injectable, signal } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private loading: boolean = false;
  public isSidebarCollapsed = signal(false);

  constructor(private apiHandlerService: ApiHandlerService) { }

  toggleSidebar(): void {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }

  updateLoader(status: boolean): void {
    this.loading = status;
    // You can emit this status through a subject if needed for UI components
  }

  getMenu(): Observable<any> {
    return this.apiHandlerService.Get('menu');
  }

  isLoading(): boolean {
    return this.loading;
  }
}
