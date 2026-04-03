import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '../select'

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
        <SelectItem value="mango">Mango</SelectItem>
      </SelectContent>
    </Select>
  )
}

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern Standard Time</SelectItem>
          <SelectItem value="cst">Central Standard Time</SelectItem>
          <SelectItem value="mst">Mountain Standard Time</SelectItem>
          <SelectItem value="pst">Pacific Standard Time</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time</SelectItem>
          <SelectItem value="cet">Central European Time</SelectItem>
          <SelectItem value="eet">Eastern European Time</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export const SmallSize: Story = {
  render: () => (
    <Select>
      <SelectTrigger size="sm" className="w-[150px]">
        <SelectValue placeholder="Select size" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="xs">Extra Small</SelectItem>
        <SelectItem value="s">Small</SelectItem>
        <SelectItem value="m">Medium</SelectItem>
        <SelectItem value="l">Large</SelectItem>
        <SelectItem value="xl">Extra Large</SelectItem>
      </SelectContent>
    </Select>
  )
}

export const WithDefaultValue: Story = {
  render: () => (
    <Select defaultValue="banana">
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectContent>
    </Select>
  )
}

export const WithDisabledItems: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana" disabled>
          Banana (Out of stock)
        </SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape" disabled>
          Grape (Out of stock)
        </SelectItem>
        <SelectItem value="mango">Mango</SelectItem>
      </SelectContent>
    </Select>
  )
}

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  )
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-[300px] flex-col gap-2">
      <label htmlFor="fruit-select" className="text-sm font-medium">
        Favorite Fruit
      </label>
      <Select>
        <SelectTrigger id="fruit-select">
          <SelectValue placeholder="Select your favorite fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
          <SelectItem value="grape">Grape</SelectItem>
          <SelectItem value="mango">Mango</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export const WithHelperText: Story = {
  render: () => (
    <div className="flex w-[300px] flex-col gap-1.5">
      <label htmlFor="country-select" className="text-sm font-medium">
        Country
      </label>
      <Select>
        <SelectTrigger id="country-select">
          <SelectValue placeholder="Select your country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="us">United States</SelectItem>
          <SelectItem value="uk">United Kingdom</SelectItem>
          <SelectItem value="ca">Canada</SelectItem>
          <SelectItem value="au">Australia</SelectItem>
          <SelectItem value="de">Germany</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        This will be used for shipping calculations
      </p>
    </div>
  )
}

export const LongList: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="us">United States</SelectItem>
        <SelectItem value="uk">United Kingdom</SelectItem>
        <SelectItem value="ca">Canada</SelectItem>
        <SelectItem value="au">Australia</SelectItem>
        <SelectItem value="de">Germany</SelectItem>
        <SelectItem value="fr">France</SelectItem>
        <SelectItem value="it">Italy</SelectItem>
        <SelectItem value="es">Spain</SelectItem>
        <SelectItem value="nl">Netherlands</SelectItem>
        <SelectItem value="be">Belgium</SelectItem>
        <SelectItem value="ch">Switzerland</SelectItem>
        <SelectItem value="at">Austria</SelectItem>
        <SelectItem value="se">Sweden</SelectItem>
        <SelectItem value="no">Norway</SelectItem>
        <SelectItem value="dk">Denmark</SelectItem>
      </SelectContent>
    </Select>
  )
}

export const FormExample: Story = {
  render: () => (
    <form className="flex w-[300px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-medium">
          Category
        </label>
        <Select>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Electronics</SelectLabel>
              <SelectItem value="phone">Phones</SelectItem>
              <SelectItem value="laptop">Laptops</SelectItem>
              <SelectItem value="tablet">Tablets</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Clothing</SelectLabel>
              <SelectItem value="shirt">Shirts</SelectItem>
              <SelectItem value="pants">Pants</SelectItem>
              <SelectItem value="shoes">Shoes</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="priority" className="text-sm font-medium">
          Priority
        </label>
        <Select>
          <SelectTrigger id="priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  )
}
