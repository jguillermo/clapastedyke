import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from './dialog';

@Component({
  imports: [Dialog],
  template: `<app-dialog [open]="open()" title="Título" (closed)="onClosed()">Cuerpo</app-dialog>`,
})
class Host {
  readonly open = signal(false);
  closedCount = 0;
  onClosed(): void {
    this.closedCount++;
  }
}

describe('Dialog', () => {
  let fixture: ComponentFixture<Host>;

  async function openDialog(): Promise<void> {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => fixture?.destroy());

  it('attaches a labelled, modal dialog panel to the overlay when open', async () => {
    await openDialog();
    const panel = document.querySelector('.app-dialog__panel');
    expect(panel).toBeTruthy();
    expect(panel?.getAttribute('role')).toBe('dialog');
    expect(panel?.getAttribute('aria-modal')).toBe('true');
  });

  it('removes the panel from the overlay when closed', async () => {
    await openDialog();
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector('.app-dialog__panel')).toBeNull();
  });

  it('emits closed when Escape is pressed', async () => {
    await openDialog();
    const panel = document.querySelector('.app-dialog__panel') as HTMLElement;
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('emits closed when the close button is clicked', async () => {
    await openDialog();
    const closeButton = document.querySelector('.app-dialog__close') as HTMLButtonElement;
    closeButton.click();
    expect(fixture.componentInstance.closedCount).toBe(1);
  });
});
