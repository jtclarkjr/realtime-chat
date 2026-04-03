import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input } from '../input'
import { SearchIcon } from 'lucide-react'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search']
    },
    disabled: {
      control: 'boolean'
    },
    required: {
      control: 'boolean'
    }
  }
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...'
  }
}

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email...'
  }
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...'
  }
}

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter number...'
  }
}

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...'
  }
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
    defaultValue: 'Cannot edit this'
  }
}

export const Required: Story = {
  args: {
    placeholder: 'Required field',
    required: true
  }
}

export const Invalid: Story = {
  args: {
    placeholder: 'Invalid input',
    'aria-invalid': true,
    defaultValue: 'invalid@'
  }
}

export const WithValue: Story = {
  args: {
    defaultValue: 'Pre-filled value'
  }
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-2">
      <label htmlFor="email-input" className="text-sm font-medium">
        Email address
      </label>
      <Input id="email-input" type="email" placeholder="Enter your email..." />
    </div>
  )
}

export const WithHelperText: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      <label htmlFor="password-input" className="text-sm font-medium">
        Password
      </label>
      <Input
        id="password-input"
        type="password"
        placeholder="Enter password..."
      />
      <p className="text-xs text-muted-foreground">
        Must be at least 8 characters long
      </p>
    </div>
  )
}

export const WithErrorMessage: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      <label htmlFor="email-error" className="text-sm font-medium">
        Email
      </label>
      <Input
        id="email-error"
        type="email"
        defaultValue="invalid@"
        aria-invalid={true}
        aria-describedby="email-error-message"
      />
      <p id="email-error-message" className="text-xs text-destructive">
        Please enter a valid email address
      </p>
    </div>
  )
}

export const WithIcon: Story = {
  render: () => (
    <div className="relative w-80">
      <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" placeholder="Search..." className="pl-9" />
    </div>
  )
}

export const FormExample: Story = {
  render: () => (
    <form className="flex w-80 flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input id="name" placeholder="John Doe" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
      </div>
    </form>
  )
}
