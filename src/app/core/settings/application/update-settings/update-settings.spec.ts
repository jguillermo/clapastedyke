import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../../_common/application/event-bus';
import { EventBusToken } from '../../../_common/core.tokens';
import { SETTINGS_REPOSITORY } from '../../domain/settings-repository';
import { MemorySettingsRepository } from '../../infrastructure/memory-settings-repository';
import { GetSettings } from '../get-settings/get-settings';
import { UpdateSettings } from './update-settings';

describe('Settings (use cases)', () => {
  let get: GetSettings;
  let update: UpdateSettings;

  beforeEach(() => {
    const repo = new MemorySettingsRepository();
    const bus = new InMemoryEventBus();

    TestBed.configureTestingModule({
      providers: [
        { provide: SETTINGS_REPOSITORY, useValue: repo },
        { provide: EventBusToken, useValue: bus },
      ],
    });
    get = TestBed.inject(GetSettings);
    update = TestBed.inject(UpdateSettings);
  });

  it('get seeds the defaults the first time and update persists them', async () => {
    expect((await get.execute()).general.defaultMargin).toBe(35);

    await update.execute({
      general: { defaultMargin: 30, businessName: 'Dulces Misa' },
      sizes: [
        { name: 'chico', factor: 0.5 },
        { name: 'mediano', factor: 1 },
        { name: 'grande', factor: 2 },
        { name: 'familiar', factor: 3 },
      ],
    });

    const settings = await get.execute();
    expect(settings.general.defaultMargin).toBe(30);
    expect(settings.general.businessName).toBe('Dulces Misa');
    expect(settings.sizes).toHaveLength(4);
  });

  it('updates the language and persists it', async () => {
    expect((await get.execute()).general.language).toBe('es'); // default

    await update.execute({ general: { language: 'en' } });
    expect((await get.execute()).general.language).toBe('en');
  });
});
