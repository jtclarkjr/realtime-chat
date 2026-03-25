import type { Preview } from '@storybook/nextjs-vite'
// @ts-expect-error - Storybook handles CSS imports during bundling
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
}

export default preview
