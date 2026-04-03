import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { AIBadge } from '@/components/ui/ai-badge'

const meta = {
  title: 'UI/AIBadge',
  component: AIBadge,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    isAnonymous: { control: 'boolean' }
  }
} satisfies Meta<typeof AIBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  args: {
    isActive: false,
    isPrivate: true,
    onToggle: () => {},
    onPrivacyToggle: () => {}
  },
  render: (args) => {
    const [isActive, setIsActive] = useState(false)
    const [isPrivate, setIsPrivate] = useState(true)

    return (
      <AIBadge
        {...args}
        isActive={isActive}
        onToggle={() => setIsActive((prev) => !prev)}
        isPrivate={isPrivate}
        onPrivacyToggle={() => setIsPrivate((prev) => !prev)}
      />
    )
  }
}

export const ActivePublic: Story = {
  args: {
    isActive: true,
    isPrivate: false,
    isAnonymous: false,
    onToggle: () => {},
    onPrivacyToggle: () => {}
  }
}

export const AnonymousUser: Story = {
  args: {
    isActive: false,
    isPrivate: true,
    isAnonymous: true,
    onToggle: () => {},
    onPrivacyToggle: () => {}
  }
}
