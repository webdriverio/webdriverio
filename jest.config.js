const testPathIgnorePatterns = [
    '<rootDir>/tests/',
    '<rootDir>/node_modules/'
]

const coveragePathIgnorePatterns = [
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
    'packages/wdio-smoke-test-service',
    'packages/eslint-plugin-wdio',
]

module.exports = {
    globals: {
        'ts-jest': {
            isolatedModules: true
        }
    },
    exclude: [
        'packages/wdio-logger/**/*.test.ts',
        'packages/wdio-utils/**/*.test.ts'
    ],
    testMatch: [
        '**/tests/**/*.test.(js|ts)'
    ],
    transform: {
        '^.+\\.(ts|js)$': 'ts-jest'
    },
    testPathIgnorePatterns,
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
            branches: 89,
            functions: 94,
            lines: 95,
            statements: 95
        }
    },
    testEnvironment: 'node',
    coveragePathIgnorePatterns,
    resolver: `${__dirname}/tests/resolver.js`,
}
