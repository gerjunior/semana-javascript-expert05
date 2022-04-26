module.exports = {
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  settings: {
    'import/core-modules': ['@jest/globals'],
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-continue': 'off',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 120,
        tabWidth: 2,
        useTabs: false,
        semi: false,
        bracketSpacing: true,
        arrowParens: 'always',
        minItems: 0,
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'function-call-argument-newline': ['error', 'consistent'],
  },
}
