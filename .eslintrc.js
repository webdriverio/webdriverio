module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'unicorn'],
    extends: [
        'eslint:recommended'
    ],
    env: {
        node: true,
        es6: true
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    rules: {
        semi: ['error', 'never'],
        indent: [2, 4],

        'no-multiple-empty-lines': [2, { 'max': 1, 'maxEOF': 1 }],
        'array-bracket-spacing': ['error', 'never'],
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
        camelcase: ['error', { properties: 'never' }],
        'comma-spacing': ['error', { before: false, after: true }],
        'no-lonely-if': 'error',
        'no-else-return': 'error',
        'no-tabs': 'error',
        'no-trailing-spaces': ['error', {
            skipBlankLines: false,
            ignoreComments: false
        }],
        quotes: ['error', 'single', { avoidEscape: true }],
        'unicode-bom': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        'keyword-spacing':['error'],
        'require-atomic-updates': 0,
        'linebreak-style': ['error', 'unix'],
        'unicorn/prefer-node-protocol': ['error', { 'checkRequire': true }]
    },
    overrides: [{
        files: ['*.ts'],
        rules: {
            // see https://stackoverflow.com/questions/55280555/typescript-eslint-eslint-plugin-error-route-is-defined-but-never-used-no-un
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'error',
            'no-undef': 'off',
            // allow overloads
            'no-redeclare': 'off'
        }
    }]
}
