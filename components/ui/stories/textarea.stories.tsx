import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Textarea } from '../textarea'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean'
    }
  }
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter your message...'
  }
}

export const WithValue: Story = {
  args: {
    defaultValue:
      'This is a pre-filled message that spans multiple lines.\n\nIt can contain paragraphs and other text content.'
  }
}

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
    defaultValue: 'Cannot edit this content'
  }
}

export const Invalid: Story = {
  args: {
    placeholder: 'Invalid content',
    'aria-invalid': true,
    defaultValue: 'This content has errors'
  }
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-2">
      <label htmlFor="message" className="text-sm font-medium">
        Message
      </label>
      <Textarea id="message" placeholder="Type your message here..." />
    </div>
  )
}

export const WithHelperText: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-1.5">
      <label htmlFor="bio" className="text-sm font-medium">
        Bio
      </label>
      <Textarea id="bio" placeholder="Tell us about yourself..." />
      <p className="text-xs text-muted-foreground">
        Brief description for your profile (max 500 characters)
      </p>
    </div>
  )
}

export const WithErrorMessage: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-1.5">
      <label htmlFor="description" className="text-sm font-medium">
        Description
      </label>
      <Textarea
        id="description"
        placeholder="Enter description..."
        aria-invalid={true}
        aria-describedby="description-error"
      />
      <p id="description-error" className="text-xs text-destructive">
        Description must be at least 10 characters long
      </p>
    </div>
  )
}

export const WithCharacterCount: Story = {
  render: () => {
    const maxLength = 200
    const currentLength = 45

    return (
      <div className="flex w-96 flex-col gap-1.5">
        <label htmlFor="limited-textarea" className="text-sm font-medium">
          Comment
        </label>
        <Textarea
          id="limited-textarea"
          placeholder="Write a comment..."
          maxLength={maxLength}
          defaultValue="This is a sample comment with character counting."
        />
        <p className="text-xs text-muted-foreground text-right">
          {currentLength} / {maxLength} characters
        </p>
      </div>
    )
  }
}

export const CustomHeight: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Small</label>
        <Textarea placeholder="Small textarea..." className="min-h-20" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Medium</label>
        <Textarea placeholder="Medium textarea..." className="min-h-32" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Large</label>
        <Textarea placeholder="Large textarea..." className="min-h-48" />
      </div>
    </div>
  )
}

export const FormExample: Story = {
  render: () => (
    <form className="flex w-96 flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          placeholder="Enter title..."
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium">
          Content
        </label>
        <Textarea id="content" placeholder="Write your content here..." />
      </div>
    </form>
  )
}
