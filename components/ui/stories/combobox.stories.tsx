import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Pin, Trash2 } from 'lucide-react'
import { Combobox } from '../combobox'

const baseOptions = [
  {
    value: 'general',
    label: 'General',
    description: 'Team-wide discussion'
  },
  {
    value: 'engineering',
    label: 'Engineering',
    description: 'Build and architecture'
  },
  {
    value: 'product',
    label: 'Product',
    description: 'Roadmap and planning'
  },
  {
    value: 'support',
    label: 'Support',
    description: 'Customer help and triage'
  }
]

const meta = {
  title: 'UI/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    options: baseOptions
  },
  render: () => {
    const [value, setValue] = useState<string>()

    return (
      <div className="w-[320px]">
        <Combobox
          options={baseOptions}
          value={value}
          onSelect={setValue}
          placeholder="Select a channel..."
        />
      </div>
    )
  }
}

export const WithActions: Story = {
  args: {
    options: baseOptions
  },
  render: () => {
    const [value, setValue] = useState<string>('engineering')
    const [pinned, setPinned] = useState<string>('general')

    return (
      <div className="w-[320px]">
        <Combobox
          options={baseOptions.map((option) => ({
            ...option,
            actions: [
              {
                icon: Pin,
                label: pinned === option.value ? 'Pinned' : 'Pin',
                onClick: (selectedValue: string) => setPinned(selectedValue),
                disabled: (selectedValue: string) => pinned === selectedValue
              },
              {
                icon: Trash2,
                label: 'Remove',
                variant: 'destructive',
                onClick: () => {}
              }
            ]
          }))}
          value={value}
          onSelect={setValue}
          placeholder="Select a channel..."
        />
      </div>
    )
  }
}

export const Disabled: Story = {
  args: {
    options: baseOptions,
    value: 'general',
    disabled: true
  },
  render: (args) => (
    <div className="w-[320px]">
      <Combobox {...args} />
    </div>
  )
}
