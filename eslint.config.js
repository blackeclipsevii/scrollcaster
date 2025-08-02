// eslint.config.js (Flat Config for Node.js)
import js from '@eslint/js';
import globals from 'globals'

export default [
  {
    files: ['./server/src/**/*.js'],
    ignores: ['**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        ...globals.node
      },
    },
    ...js.configs.recommended,
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  },
];