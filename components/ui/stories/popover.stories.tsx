import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { Button } from '../button'
import { Input } from '../input'
import { SettingsIcon, UserIcon } from 'lucide-react'

const meta = {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">This is a basic popover with some content.</p>
      </PopoverContent>
    </Popover>
  )
}

export const WithTitle: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold">Popover Title</h4>
          <p className="text-sm text-muted-foreground">
            This popover has a title and description.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>
          <SettingsIcon className="size-4" />
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the element.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <label htmlFor="width" className="text-sm">
                Width
              </label>
              <Input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <label htmlFor="height" className="text-sm">
                Height
              </label>
              <Input
                id="height"
                defaultValue="25px"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const WithIcon: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <UserIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold">User Profile</h4>
          <p className="text-sm text-muted-foreground">
            View your profile settings and information.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const DifferentPlacements: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-16">
      <Popover>
        <PopoverTrigger asChild>
          <Button>Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top">
          <p className="text-sm">Popover on top</p>
        </PopoverContent>
      </Popover>

      <div className="flex gap-16">
        <Popover>
          <PopoverTrigger asChild>
            <Button>Left</Button>
          </PopoverTrigger>
          <PopoverContent side="left">
            <p className="text-sm">Popover on left</p>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button>Right</Button>
          </PopoverTrigger>
          <PopoverContent side="right">
            <p className="text-sm">Popover on right</p>
          </PopoverContent>
        </Popover>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button>Bottom</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom">
          <p className="text-sm">Popover on bottom</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export const WithActions: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Open Menu</Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Quick Actions</h4>
            <p className="text-xs text-muted-foreground">
              Choose an action to perform
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="ghost" className="justify-start">
              Edit
            </Button>
            <Button size="sm" variant="ghost" className="justify-start">
              Duplicate
            </Button>
            <Button size="sm" variant="ghost" className="justify-start">
              Archive
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="justify-start text-destructive"
            >
              Delete
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const NarrowContent: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Info</Button>
      </PopoverTrigger>
      <PopoverContent className="w-40">
        <p className="text-xs">Small popover with minimal content.</p>
      </PopoverContent>
    </Popover>
  )
}

export const WideContent: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Show Details</Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold">Detailed Information</h4>
          <p className="text-sm text-muted-foreground">
            This is a wider popover that can contain more detailed information
            and longer content. It automatically adjusts to the screen size on
            smaller devices.
          </p>
          <div className="flex gap-2">
            <Button size="sm">Accept</Button>
            <Button size="sm" variant="outline">
              Decline
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
