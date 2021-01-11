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
        '<rootDir>/node_modules/'
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
            branches: 93,
            functions: 97,
            lines: 98,
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
