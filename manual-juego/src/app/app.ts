import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Hud } from './componentes/hud/hud';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Hud],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
