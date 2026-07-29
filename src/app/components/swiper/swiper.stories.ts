import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MigoSwiper } from './swiper';
import { MigoSwiperSlide } from './swiper-slide';

/** Espía de la salida `indexChange`; el `play` lo limpia antes de ejercer el carrusel. */
const onIndexChange = fn();

const meta: Meta<MigoSwiper> = {
  title: 'Components/Swiper',
  component: MigoSwiper,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [MigoSwiper, MigoSwiperSlide] })],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-swiper` es el carrusel **mobile-first** del design system: una fila de **pestañas ' +
          'accesibles** sincronizada con el swipe. Envuelve **Swiper Element** (web component), la ' +
          'única librería de UI externa aprobada además del CDK: su `register()` se llama al cargar ' +
          'el componente y su CSS vive en el **shadow DOM**, así que no choca con Tailwind ni con el ' +
          'CSS global. El `CUSTOM_ELEMENTS_SCHEMA` queda **encapsulado aquí** — ninguna feature lo ' +
          'necesita.\n\n' +
          'Los slides se declaran con la directiva **`migoSwiperSlide`** sobre un `<ng-template>`, ' +
          'cada uno con su `label` (el texto de su pestaña). Por eso los slides **no son un input**: ' +
          'se proyectan como contenido y no aparecen en Controls.\n\n' +
          'Las pestañas siguen el patrón ARIA completo (`tablist`/`tab`/`tabpanel`, roving ' +
          '`tabindex`, ←/→/Home/End) y el target táctil es de 44px. Además del output ' +
          '**`indexChange`**, expone el método **`slideTo(i)`** para moverlo desde el consumidor.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onIndexChange },
    template: `
      <migo-swiper [ariaLabel]="ariaLabel" (indexChange)="onIndexChange($event)">
        <ng-template migoSwiperSlide label="Queques">
          Bizcochos y masas base.
        </ng-template>
        <ng-template migoSwiperSlide label="Rellenos">
          Cremas, mermeladas y ganaches.
        </ng-template>
        <ng-template migoSwiperSlide label="Coberturas">
          Fondant, buttercream y glaseados.
        </ng-template>
      </migo-swiper>
    `,
  }),
  argTypes: {
    ariaLabel: {
      control: 'text',
      description:
        'Nombre accesible del grupo de pestañas (`aria-label` del `role="tablist"`). Describe de ' +
        'qué es la colección, no la pestaña activa.',
      table: { defaultValue: { summary: '(vacío)' } },
    },
  },
  args: {
    ariaLabel: 'Tipos de receta',
  },
};
export default meta;

type Story = StoryObj<MigoSwiper>;

/**
 * Único story: tres slides declarados con `migoSwiperSlide`. Cambia entre ellos con las pestañas,
 * con las flechas del teclado o arrastrando; `ariaLabel` se edita desde **Controls**.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onIndexChange.mockClear();

    // Patrón ARIA de tabs: un tablist nombrado y una pestaña por slide.
    const tablist = canvas.getByRole('tablist', { name: 'Tipos de receta' });
    const tabs = within(tablist).getAllByRole('tab');
    await expect(tabs).toHaveLength(3);

    // Estado inicial: la primera está seleccionada y es la única tabulable (roving tabindex).
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await expect(tabs[0]).toHaveAttribute('tabindex', '0');
    await expect(tabs[1]).toHaveAttribute('tabindex', '-1');

    // Interacción real: tocar una pestaña mueve el carrusel y avisa al consumidor.
    await userEvent.click(tabs[1]);
    await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    await expect(onIndexChange).toHaveBeenCalledWith(1);

    // Teclado del patrón tabs: → avanza y lleva el foco consigo.
    await userEvent.keyboard('{ArrowRight}');
    await expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    await expect(onIndexChange).toHaveBeenLastCalledWith(2);
    await waitFor(async () => {
      await expect(tabs[2]).toHaveFocus();
    });
  },
};
