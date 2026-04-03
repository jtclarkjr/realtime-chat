import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from '../button'
import { PlusIcon, TrashIcon, DownloadIcon } from 'lucide-react'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
        'discord',
        'github',
        'apple',
        'google',
        'text-danger'
      ]
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'xl', 'icon']
    },
    disabled: {
      control: 'boolean'
    },
    asChild: {
      control: 'boolean'
    }
  }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default'
  }
}

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive'
  }
}

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline'
  }
}

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary'
  }
}

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost'
  }
}

export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'link'
  }
}

export const Discord: Story = {
  args: {
    children: 'Continue with Discord',
    variant: 'discord'
  }
}

export const GitHub: Story = {
  args: {
    children: 'Continue with GitHub',
    variant: 'github'
  }
}

export const Apple: Story = {
  args: {
    children: 'Continue with Apple',
    variant: 'apple'
  }
}

export const Google: Story = {
  args: {
    children: 'Continue with Google',
    variant: 'google'
  }
}

export const TextDanger: Story = {
  args: {
    children: 'Delete',
    variant: 'text-danger'
  }
}

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm'
  }
}

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg'
  }
}

export const ExtraLarge: Story = {
  args: {
    children: 'Extra Large',
    size: 'xl'
  }
}

export const Icon: Story = {
  args: {
    size: 'icon',
    children: <PlusIcon />
  }
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <DownloadIcon />
        Download
      </>
    )
  }
}

export const WithTrailingIcon: Story = {
  args: {
    children: (
      <>
        Delete
        <TrashIcon />
      </>
    ),
    variant: 'destructive'
  }
}

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true
  }
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="discord">Discord</Button>
        <Button variant="github">GitHub</Button>
        <Button variant="apple">Apple</Button>
        <Button variant="google">Google</Button>
        <Button variant="text-danger">Text Danger</Button>
      </div>
    </div>
  )
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
      <Button size="icon">
        <PlusIcon />
      </Button>
    </div>
  )
}
