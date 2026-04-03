import type { StorybookConfig } from '@storybook/nextjs-vite'

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    // Work around duplicate preview annotation registration in Storybook 10.3.
    '@chromatic-com/storybook/preset',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest'
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {}
  }
}
export default config
