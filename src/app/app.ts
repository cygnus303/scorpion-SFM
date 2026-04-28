import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { Header } from './components/header/header';
import { MainContent } from './components/main-content/main-content';
import { Login } from './components/login/login';

@Component({
  selector: 'app-root',
  imports: [ Sidebar, Header, MainContent, Login],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('scorpion-SFM');
}
