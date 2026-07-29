import type { Meta, StoryObj } from '@storybook/angular-vite';
import { Button, ButtonSize, ButtonVariant } from './button';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: ButtonSize[] = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];

const meta: Meta<Button> = {
  title: 'Components/Button',
  component: Button,
  render: (args) => ({
    props: args,
    template: `
      <button
        migo-button
        [variant]="variant"
        [size]="size"
        [loading]="loading"
        [block]="block"
        [disabled]="disabled"
      >
        Guardar
      </button>
    `,
  }),
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
  },
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    block: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<Button>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger' } };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Block: Story = { args: { block: true } };
