/** @type {import('eslint').Linter.Config} */
const config = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'unicorn', 'import'],
    extends: ['eslint:recommended'],
    env: {
        node: true,
        es6: true,
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    rules: {
        quotes: ['error', 'single', { avoidEscape: true }],
        camelcase: ['error', { properties: 'never' }],
        semi: ['error', 'never'],
        indent: [2, 4],
        eqeqeq: ['error', 'always'],

        'prefer-const': 'error',
        'no-multiple-empty-lines': [2, { max: 1, maxEOF: 1 }],
        'array-bracket-spacing': ['error', 'never'],
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
        'comma-spacing': ['error', { before: false, after: true }],
        'no-lonely-if': 'error',
        'dot-notation': 'error',
        'no-else-return': 'error',
        'no-tabs': 'error',
        'no-trailing-spaces': [
            'error',
            {
                skipBlankLines: false,
                ignoreComments: false,
            },
        ],
        'no-var': 'error',
        'unicode-bom': ['error', 'never'],
        curly: ['error', 'all'],
        'object-curly-spacing': ['error', 'always'],
        'keyword-spacing': ['error'],
        'require-atomic-updates': 0,
        'linebreak-style': ['error', 'unix'],
        'unicorn/prefer-node-protocol': ['error'],
        'import/extensions': ['error', 'ignorePackages'],
        'no-restricted-syntax': [
            'error',
            'IfStatement > ExpressionStatement > AssignmentExpression',
        ],
        'unicorn/prefer-ternary': 'error',
    },
    overrides: [
        {
            files: ['*.ts'],
            rules: {
                // see https://stackoverflow.com/questions/55280555/typescript-eslint-eslint-plugin-error-route-is-defined-but-never-used-no-un
                'no-unused-vars': 'off',
                '@typescript-eslint/no-unused-vars': 'error',
                '@typescript-eslint/consistent-type-imports': 'error',
                'no-undef': 'off',
                // allow overloads
                'no-redeclare': 'off',
            },
        },
        {
            files: ['*.test.ts'],
            rules: {
                'dot-notation': 'off',
            },
        },
    ],
}

module.exports = config
