import { Dialog } from '@angular/cdk/dialog';
import { ApplicationRef, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MIGO_DIALOG_DATA, MigoDialog, MigoDialogRef } from './dialog.service';

interface TestData {
  msg: string;
}

@Component({
  template: `<p class="test-dialog">{{ data.msg }}</p>`,
})
class TestDialog {
  readonly ref = inject<MigoDialogRef<string>>(MigoDialogRef);
  readonly data = inject<TestData>(MIGO_DIALOG_DATA);
}

describe('MigoDialog', () => {
  let dialog: MigoDialog;
  let appRef: ApplicationRef;

  beforeEach(() => {
    dialog = TestBed.inject(MigoDialog);
    appRef = TestBed.inject(ApplicationRef);
  });

  afterEach(() => TestBed.inject(Dialog).closeAll());

  it('opens the given component as the dialog content with its data', () => {
    dialog.open<string, TestData, TestDialog>(TestDialog, { data: { msg: 'hola' } });
    appRef.tick();
    const panel = document.querySelector('.test-dialog');
    expect(panel?.textContent).toContain('hola');
  });

  it('applies the Migo backdrop class', () => {
    dialog.open<string, TestData, TestDialog>(TestDialog, { data: { msg: 'x' } });
    appRef.tick();
    expect(document.querySelector('.migo-dialog__backdrop')).toBeTruthy();
  });

  it('resolves closed with the result passed to close()', () => {
    const ref = dialog.open<string, TestData, TestDialog>(TestDialog, { data: { msg: 'x' } });
    let result: string | undefined;
    ref.closed.subscribe((value) => (result = value));
    ref.close('aceptado');
    expect(result).toBe('aceptado');
  });
});
