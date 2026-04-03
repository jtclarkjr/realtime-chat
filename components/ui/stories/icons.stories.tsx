import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { DiscordIcon, GitHubIcon, AppleIcon, GoogleIcon } from '../icons'

const meta = {
  title: 'UI/Icons',
  component: DiscordIcon,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof DiscordIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Discord: Story = {
  render: () => <DiscordIcon />
}

export const GitHub: Story = {
  render: () => <GitHubIcon />
}

export const Apple: Story = {
  render: () => <AppleIcon />
}

export const Google: Story = {
  render: () => <GoogleIcon />
}

export const AllIcons: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <div className="flex flex-col items-center gap-2">
        <DiscordIcon />
        <span className="text-sm text-muted-foreground">Discord</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <GitHubIcon />
        <span className="text-sm text-muted-foreground">GitHub</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <AppleIcon />
        <span className="text-sm text-muted-foreground">Apple</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <GoogleIcon />
        <span className="text-sm text-muted-foreground">Google</span>
      </div>
    </div>
  )
}

export const CustomSize: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <DiscordIcon className="w-4 h-4" />
      <DiscordIcon className="w-6 h-6" />
      <DiscordIcon className="w-8 h-8" />
      <DiscordIcon className="w-12 h-12" />
    </div>
  )
}

export const CustomColor: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <DiscordIcon className="text-blue-500" />
      <GitHubIcon className="text-gray-800" />
      <AppleIcon className="text-black dark:text-white" />
      <GoogleIcon />
    </div>
  )
}

export const InButtons: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <button className="flex items-center gap-2 rounded-md bg-[#5865F2] text-white px-4 py-2 hover:bg-[#4752C4]">
        <DiscordIcon className="w-5 h-5" />
        Continue with Discord
      </button>
      <button className="flex items-center gap-2 rounded-md bg-black text-white px-4 py-2 hover:bg-gray-800">
        <GitHubIcon className="w-5 h-5" />
        Continue with GitHub
      </button>
      <button className="flex items-center gap-2 rounded-md bg-black text-white px-4 py-2 hover:bg-gray-800">
        <AppleIcon className="w-5 h-5" />
        Continue with Apple
      </button>
      <button className="flex items-center gap-2 rounded-md border bg-white text-black px-4 py-2 hover:bg-gray-100 dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800">
        <GoogleIcon className="w-5 h-5" />
        Continue with Google
      </button>
    </div>
  )
}
