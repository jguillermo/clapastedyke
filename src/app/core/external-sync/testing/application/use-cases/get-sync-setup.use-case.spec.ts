import { TestBed } from '@angular/core/testing';
import { FakeSyncSetupSource, makeExternalSyncFakes } from '../../external-sync-test-doubles';
import { GetSyncSetup } from '../../../application/use-cases/get-sync-setup.use-case';

describe('GetSyncSetup', () => {
  let getSetup: GetSyncSetup;
  let source: FakeSyncSetupSource;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    getSetup = TestBed.inject(GetSyncSetup);
    source = TestBed.inject(FakeSyncSetupSource);
  });

  it('entrega cada trozo en su sitio, listo para pintar sin buscarlo', async () => {
    const setup = await getSetup.execute();

    expect(setup).toEqual({
      script: 'function doPost() {}',
      manifest: '{ "runtimeVersion": "V8" }',
      clientId: '123-abc.apps.googleusercontent.com',
      origin: 'https://example.test',
      endpoint: 'https://script.example.test/exec',
      configured: true,
    });
  });

  it('un hueco sin resolver llega vacío, no ausente: la guía tiene que poder contarlo', async () => {
    source.setup = {
      snippets: [{ id: 'origin', value: 'https://example.test' }],
      configured: false,
    };

    const setup = await getSetup.execute();

    expect(setup.script).toBe('');
    expect(setup.clientId).toBe('');
    expect(setup.endpoint).toBe('');
    expect(setup.origin).toBe('https://example.test');
    expect(setup.configured).toBe(false);
  });
});
