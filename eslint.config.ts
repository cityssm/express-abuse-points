import { configWebApp, cspellWords, defineConfig } from 'eslint-config-cityssm'

export const config = defineConfig(configWebApp, {
  files: ['**/*.ts'],
  rules: {
    '@cspell/spellchecker': [
      'warn',
      {
        cspell: {
          words: [
            ...cspellWords,
            'TABLECOLUMNS',
            'TABLENAME',
            'TINYINT',
            'XFORWARDEDFOR'
          ]
        }
      }
    ]
  }
})

export default config
