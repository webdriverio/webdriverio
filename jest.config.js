/**
 * workaround for bug
 * https://github.com/jsdom/jsdom/issues/2795
 * https://github.com/jsdom/jsdom/issues/2961
 */
const SKIPPED_NODE_10_TESTS = process.version.startsWith('v10')
    ? [
        '<rootDir>/packages/webdriverio/tests/commands/browser/newWindow.test.ts',
        '<rootDir>/packages/webdriverio/tests/commands/element/isFocused.test.ts',
        '<rootDir>/packages/webdriverio/tests/scripts/resq.test.ts',
        '<rootDir>/packages/webdriverio/tests/scripts/isFocused.test.ts'
    ]
    : []

module.exports = {
    globals: {
        'ts-jest': {
            isolatedModules: true
        }
    },
    testMatch: [
        '**/tests/**/*.test.(js|ts)'
    ],
    transform: {
        '^.+\\.(ts|js)$': 'ts-jest'
    },
    testPathIgnorePatterns: [
        '<rootDir>/tests/',
        '<rootDir>/node_modules/',
        ...SKIPPED_NODE_10_TESTS
    ],
    collectCoverageFrom: [
        'packages/**/src/**/*.(js|ts)',
        '!packages/**/src/**/*.d.ts'
    ],
    moduleNameMapper: {
        'graceful-fs': '<rootDir>/tests/helpers/fs.js'
    },
    coverageDirectory: './coverage/',
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 95,
            functions: 98,
            lines: 99,
            statements: 98
        }
    },
    testEnvironment: 'node',
    coveragePathIgnorePatterns: [
        'node_modules/',
        'packages/devtools/src/scripts',
        'packages/devtools/src/commands',
        'packages/webdriverio/src/scripts',
        'packages/wdio-devtools-service/src/scripts',
        'packages/webdriverio/build',
        'packages/webdriver/build',
        'packages/wdio-cucumber-framework/tests/fixtures',
        'packages/wdio-logger/build',
        'packages/wdio-webdriver-mock-service',
        'packages/wdio-smoke-test-reporter',
        'packages/wdio-smoke-test-service'
    ]
}
