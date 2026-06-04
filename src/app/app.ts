import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Shell raíz. El juego es inmersivo a pantalla completa (cocina en `/home`,
 * pueblo en `/town`); cada pantalla es su propio fondo y chrome.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
