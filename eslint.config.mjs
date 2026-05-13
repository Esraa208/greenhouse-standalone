import tseslint from 'typescript-eslint';

/**
 * Editor hints that mirror CI `check-boundaries.mjs` root-barrel rule.
 * Deep paths under data-access are enforced by `npm run check:boundaries` only.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.angular/**'],
  },
  {
    files: ['src/app/features/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@app/core/data-access',
              message:
                "Use domain barrels (@app/core/data-access/infrastructure, sales, ...), not the deprecated root @app/core/data-access barrel. Matches check-boundaries.mjs.",
            },
            {
              name: '@app/core/data-access/api',
              message:
                'Only internals of src/app/core/data-access may import @app/core/data-access/api.',
            },
            {
              name: '@app/core/models/api-types',
              message:
                'Import API shapes through data-access barrels, not @app/core/models/api-types.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/shared/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: '@app/features', message: "Shared cannot import @app/features." }],
          patterns: [
            {
              group: ['@app/features/*'],
              message: 'Shared cannot import feature bundles.',
            },
          ],
        },
      ],
    },
  },
);
