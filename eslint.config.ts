import configWebApp, { defineConfig } from 'eslint-config-cityssm'
import { cspellWords } from 'eslint-config-cityssm/exports.js'

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
