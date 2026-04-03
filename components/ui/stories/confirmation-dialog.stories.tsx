import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Button } from '../button'
import { ConfirmationDialog } from '../confirmation-dialog'

const meta = {
  title: 'UI/ConfirmationDialog',
  component: ConfirmationDialog,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof ConfirmationDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
    title: 'Archive room?',
    description: 'This room will be moved out of your active list.',
    onConfirm: () => {}
  },
  render: () => {
    const [open, setOpen] = useState(false)

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <ConfirmationDialog
          open={open}
          onOpenChange={setOpen}
          title="Archive room?"
          description="This room will be moved out of your active list."
          onConfirm={() => setOpen(false)}
        />
      </>
    )
  }
}

export const Destructive: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
    title: 'Delete room permanently?',
    description: 'This action cannot be undone.',
    variant: 'destructive',
    onConfirm: () => {}
  },
  render: () => {
    const [open, setOpen] = useState(false)

    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete room
        </Button>
        <ConfirmationDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete room permanently?"
          description="This action cannot be undone."
          variant="destructive"
          confirmText="Delete"
          onConfirm={() => setOpen(false)}
        />
      </>
    )
  }
}

export const Loading: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    title: 'Deleting room',
    description: 'Please wait while we remove all related messages.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'destructive',
    loading: true,
    onConfirm: () => {}
  }
}
