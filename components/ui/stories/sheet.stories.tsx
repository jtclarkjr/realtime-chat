import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../sheet'
import { Button } from '../button'
import { Input } from '../input'

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Update your profile details and save when done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <Input placeholder="Display name" />
          <Input type="email" placeholder="Email address" />
        </div>
        <SheetFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left Sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            Quick links for common workspace tasks.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-2 py-4 text-sm">
          <div className="rounded-md border p-3">All channels</div>
          <div className="rounded-md border p-3">Direct messages</div>
          <div className="rounded-md border p-3">Mentions</div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Open Bottom Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Attach files</SheetTitle>
          <SheetDescription>
            Select a source for uploading files.
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 py-4">
          <Button variant="outline">Computer</Button>
          <Button variant="outline">Google Drive</Button>
          <Button variant="outline">Dropbox</Button>
          <Button variant="outline">Recent files</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
