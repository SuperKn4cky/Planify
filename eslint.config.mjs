import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/eslint.config.*',
      '**/next.config.*',
      '**/postcss.config.*',
      '**/tailwind.config.*',
      '**/jest.config.*',
      '**/*.config.*',
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ['packages/frontend/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    files: ['packages/backend/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },

  ...tseslint.configs.recommendedTypeChecked,

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'double'],
      indent: ['error', 4, { SwitchCase: 1 }],
    },
  },

  {
    files: ['packages/frontend/**/*.{ts,tsx,js,jsx}'],
    languageOptions: { globals: { window: 'readonly', document: 'readonly' } },
  },
  {
    files: ['packages/backend/**/*.ts'],
    languageOptions: { globals: { process: 'readonly', __dirname: 'readonly' } },
  },
];
