import { provideHttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Translation, TranslocoLoader, provideTransloco } from '@jsverse/transloco';
import { of } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';

/** Tests don't fetch real translation files: every key resolves to itself. */
@Injectable()
class FakeTranslocoLoader implements TranslocoLoader {
  getTranslation(): ReturnType<TranslocoLoader['getTranslation']> {
    return of({} as Translation);
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideTransloco({
          config: {
            availableLangs: ['es', 'en'],
            defaultLang: 'es',
            fallbackLang: 'es',
            missingHandler: { logMissingKey: false },
          },
          loader: FakeTranslocoLoader,
        }),
      ],
    }).compileComponents();
  });

  it('creates the app shell with the game HUD', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance).toBeTruthy();
    expect(compiled.querySelector('app-hud')).toBeTruthy();
  });
});
