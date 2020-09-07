module.exports = {
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    transform: {
        '^.+\\.(ts|js)$': 'ts-jest'
    },
    testPathIgnorePatterns: [
        '<rootDir>/tests/',
        '<rootDir>/node_modules/'
    ],
    collectCoverageFrom: [
        'packages/**/src/**/*.js'
    ],
    moduleNameMapper: {
        'graceful-fs': '<rootDir>/tests/helpers/fs.js'
    },
    coverageDirectory: './coverage/',
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 96,
            functions: 98,
            lines: 99,
            statements: 99
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
        'packages/wdio-lambda-runner',
        'packages/wdio-smoke-test-reporter',
        'packages/wdio-smoke-test-service'
    ]
}
