import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Toaster } from '../sonner'
import { toast } from 'sonner'

const meta = {
  title: 'UI/Sonner',
  component: Toaster,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div>
      <Toaster />
      <button
        onClick={() => toast('This is a default toast')}
        className="rounded-md border px-4 py-2 text-sm"
      >
        Show Toast
      </button>
    </div>
  )
}

export const Success: Story = {
  render: () => (
    <div>
      <Toaster />
      <button
        onClick={() => toast.success('Operation completed successfully!')}
        className="rounded-md border px-4 py-2 text-sm"
      >
        Show Success Toast
      </button>
    </div>
  )
}

export const Error: Story = {
  render: () => (
    <div>
      <Toaster />
      <button
        onClick={() => toast.error('Something went wrong!')}
        className="rounded-md border px-4 py-2 text-sm"
      >
        Show Error Toast
      </button>
    </div>
  )
}

export const Warning: Story = {
  render: () => (
    <div>
      <Toaster />
      <button
        onClick={() => toast.warning('Please proceed with caution')}
        className="rounded-md border px-4 py-2 text-sm"
      >
        Show Warning Toast
      </button>
    </div>
  )
}

export const Info: Story = {
  render: () => (
    <div>
      <Toaster />
      <button
        onClick={() => toast.info('Here is some information')}
        className="rounded-md border px-4 py-2 text-sm"
      >
        Show Info Toast
      </button>
    </div>
  )
}

export const WithAction: Story = {
  render: () => (
    <div>
      <Toaster />
      <button
        onClick={() =>
          toast('Event has been created', {
            action: {
              label: 'Undo',
              onClick: () => console.log('Undo')
            }
          })
        }
        className="rounded-md border px-4 py-2 text-sm"
      >
        Show Toast with Action
      </button>
    </div>
  )
}

export const WithDescription: Story = {
  render: () => (
    <div>
      <Toaster />
      <button
        onClick={() =>
          toast('New message received', {
            description: 'You have a new message from John Doe'
          })
        }
        className="rounded-md border px-4 py-2 text-sm"
      >
        Show Toast with Description
      </button>
    </div>
  )
}

export const PromiseToast: Story = {
  render: () => (
    <div>
      <Toaster />
      <button
        onClick={() => {
          const promise = new globalThis.Promise((resolve) =>
            setTimeout(() => resolve({ name: 'Data' }), 2000)
          )
          toast.promise(promise, {
            loading: 'Loading...',
            success: 'Data loaded successfully',
            error: 'Failed to load data'
          })
        }}
        className="rounded-md border px-4 py-2 text-sm"
      >
        Show Promise Toast
      </button>
    </div>
  )
}

export const AllTypes: Story = {
  render: () => (
    <div>
      <Toaster />
      <div className="flex flex-col gap-2">
        <button
          onClick={() => toast('Default toast')}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Default
        </button>
        <button
          onClick={() => toast.success('Success toast')}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Success
        </button>
        <button
          onClick={() => toast.error('Error toast')}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Error
        </button>
        <button
          onClick={() => toast.warning('Warning toast')}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Warning
        </button>
        <button
          onClick={() => toast.info('Info toast')}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Info
        </button>
      </div>
    </div>
  )
}
