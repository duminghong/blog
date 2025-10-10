import { defineConfig, presetAttributify, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify()
  ],
  theme: {
    colors: {
      primary: 'var(--vp-c-brand)',
      'primary-light': 'var(--vp-c-brand-light)',
      'primary-lighter': 'var(--vp-c-brand-lighter)',
      'primary-dark': 'var(--vp-c-brand-dark)',
      'primary-darker': 'var(--vp-c-brand-darker)',
    }
  }
})