import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { UserAvatar } from '../user-avatar'

const meta = {
  title: 'UI/UserAvatar',
  component: UserAvatar,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl']
    },
    show: { control: 'boolean' }
  }
} satisfies Meta<typeof UserAvatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    alt: 'Jane Doe',
    size: 'md',
    show: true
  }
}

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/96?img=32',
    alt: 'Profile avatar',
    size: 'lg',
    show: true
  }
}

export const Sizes: Story = {
  args: {
    alt: 'User avatar'
  },
  render: () => (
    <div className="flex items-center gap-3">
      <UserAvatar alt="Small avatar" size="sm" />
      <UserAvatar alt="Medium avatar" size="md" />
      <UserAvatar alt="Large avatar" size="lg" />
      <UserAvatar alt="Extra large avatar" size="xl" />
    </div>
  )
}

export const Hidden: Story = {
  args: {
    alt: 'Hidden avatar',
    show: false
  }
}
