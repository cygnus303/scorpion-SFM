import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { Header } from './components/header/header';
import { MainContent } from './components/main-content/main-content';

@Component({
  selector: 'app-root',
  imports: [ Sidebar, Header, MainContent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('scorpion-SFM');
}
