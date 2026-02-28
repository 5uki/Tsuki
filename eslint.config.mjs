import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * 根级 ESLint 配置 — 供 lint-staged（husky pre-commit）使用
 * 各子项目（apps/web、apps/admin、packages/*、services/*）
 * 各自有更具体的 eslint.config.mjs。
 */
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/',
      '**/dist/',
      'node_modules/',
      '**/node_modules/',
      '**/.astro/',
      'apps/admin/dist/',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  }
)
