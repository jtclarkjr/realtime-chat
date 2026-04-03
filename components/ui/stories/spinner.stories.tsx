import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Spinner } from '../spinner'
import { Button } from '../button'

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    variant: {
      control: 'select',
      options: ['default', 'white']
    }
  }
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    size: 'md',
    variant: 'default'
  }
}

export const Small: Story = {
  args: {
    size: 'sm'
  }
}

export const Medium: Story = {
  args: {
    size: 'md'
  }
}

export const Large: Story = {
  args: {
    size: 'lg'
  }
}

export const WhiteVariant: Story = {
  args: {
    variant: 'white'
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-800 p-8 rounded-md">
        <Story />
      </div>
    )
  ]
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs text-muted-foreground">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-xs text-muted-foreground">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-xs text-muted-foreground">Large</span>
      </div>
    </div>
  )
}

export const InButton: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button disabled>
        <Spinner size="sm" className="mr-2" />
        Loading...
      </Button>
      <Button variant="outline" disabled>
        <Spinner size="sm" className="mr-2" />
        Processing
      </Button>
      <Button variant="secondary" disabled>
        <Spinner size="sm" className="mr-2" />
        Saving
      </Button>
    </div>
  )
}

export const InDarkButton: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button disabled>
        <Spinner size="sm" variant="white" className="mr-2" />
        Loading...
      </Button>
      <Button variant="destructive" disabled>
        <Spinner size="sm" variant="white" className="mr-2" />
        Deleting
      </Button>
    </div>
  )
}

export const Centered: Story = {
  render: () => (
    <div className="flex h-48 w-96 items-center justify-center border rounded-md">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading content...</p>
      </div>
    </div>
  )
}

export const WithText: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Spinner size="sm" />
        <span className="text-sm">Loading...</span>
      </div>
      <div className="flex items-center gap-3">
        <Spinner size="md" />
        <span className="text-sm">Processing your request...</span>
      </div>
      <div className="flex items-center gap-3">
        <Spinner size="lg" />
        <span className="text-sm">Please wait while we fetch your data...</span>
      </div>
    </div>
  )
}

export const LoadingCard: Story = {
  render: () => (
    <div className="w-96 rounded-lg border bg-card p-6">
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Spinner size="lg" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold">Loading your dashboard</h3>
          <p className="text-sm text-muted-foreground">
            This will only take a moment...
          </p>
        </div>
      </div>
    </div>
  )
}

export const InlineSpinner: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-96">
      <p className="text-sm">
        Your request is being processed{' '}
        <Spinner size="sm" className="inline-block" />
      </p>
      <p className="text-sm">
        Uploading files <Spinner size="sm" className="inline-block ml-1" />{' '}
        Please don&apos;t close this window.
      </p>
    </div>
  )
}

export const CustomColor: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner className="border-blue-500 border-t-transparent" />
        <span className="text-xs text-muted-foreground">Blue</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner className="border-green-500 border-t-transparent" />
        <span className="text-xs text-muted-foreground">Green</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner className="border-red-500 border-t-transparent" />
        <span className="text-xs text-muted-foreground">Red</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner className="border-purple-500 border-t-transparent" />
        <span className="text-xs text-muted-foreground">Purple</span>
      </div>
    </div>
  )
}
