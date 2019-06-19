module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings'
  ],
  env: {
    node: true,
    es6: true
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2016,
    sourceType: 'module'
  },
  rules: {
    semi: ['error', 'never'],
    quotes: ['error', 'single'],
    indent: [2, 4],

    'import/no-unresolved': [2, { commonjs: true, amd: true }],
    'import/named': 2,
    'import/namespace': 2,
    'import/default': 2,
    'import/export': 2,

    'no-multiple-empty-lines': [2, {'max': 1, 'maxEOF': 1}],
    'array-bracket-spacing': ['error', 'never'],
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    camelcase: ['error', { properties: 'never' }],
    'comma-spacing': ['error', { before: false, after: true }],
    'no-lonely-if': 'error',
    'no-tabs': 'error',
    'no-trailing-spaces': ['error', {
      skipBlankLines: false,
      ignoreComments: false
    }],
    quotes: ['error', 'single', { avoidEscape: true }],
    'unicode-bom': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'require-atomic-updates': 0
  }
}
