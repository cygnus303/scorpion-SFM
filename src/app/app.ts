import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Sidebar } from './components/layouts/sidebar/sidebar';
import { Header } from './components/layouts/header/header';
import { CommonModule } from '@angular/common';
import { CommonService } from './shared/services/common.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, Header, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('scorpion-SFM');
  private router = inject(Router);
  public commonService = inject(CommonService);

  get isLoginPage(): boolean {
    return this.router.url === '/login' || this.router.url === '/';
  }
}
