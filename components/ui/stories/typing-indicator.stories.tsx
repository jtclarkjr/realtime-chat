import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TypingIndicator } from '../typing-indicator'

const meta = {
  title: 'UI/TypingIndicator',
  component: TypingIndicator,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof TypingIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {}
}

export const CustomMessage: Story = {
  args: {
    message: 'Generating room summary...'
  }
}
