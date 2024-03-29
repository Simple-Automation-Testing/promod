module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    mocha: true,
  },
  globals: {
    'describe:': 'readonly',
  },
  plugins: ['sonarjs', 'promise', 'unicorn', 'prettier', 'no-only-tests'],
  parser: '@typescript-eslint/parser',
  rules: {
    'jsdoc/valid-types': 'off',
    'jsdoc/check-property-names': 'off',
    'no-await-in-loop': 'off',
    'unicorn/no-null': 'off',
    'jsdoc/no-undefined-types': 'off',
    'unicorn/explicit-length-check': 'off',
    'no-restricted-syntax': 'off',
    'func-names': 'off',
    'no-plusplus': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-reduce': 'off',
    'no-unused-expressions': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/import-style': 'off',
    'no-useless-constructor': 'off',
    'unicorn/prefer-module': 'off',
    'unicorn/prefer-spread': 'off',
    'unicorn/consistent-destructuring': 'off',
    'import/no-unresolved': 'off',
    'unicorn/no-this-assignment': 'off',
    'unicorn/no-array-for-each': 'off',
    'default-case': 'off',
    'sonarjs/no-duplicate-string': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/filename-case': 'off',
    'unicorn/no-abusive-eslint-disable': 'off',
    'no-only-tests/no-only-tests': 'error',
    'no-console': 'error',
  },
  extends: ['plugin:sonarjs/recommended', 'plugin:unicorn/recommended', 'prettier', 'plugin:prettier/recommended'],
  globals: {
    browser: 'readonly',
  },
};
