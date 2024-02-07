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

/**
 * check Node.js version and ignore `@wdio/sync` test if we
 * are on v16 or higher
 */
const [major] = process.versions.node.split('.')
if (parseInt(major) >= 16) {
    testPathIgnorePatterns.push('<rootDir>/packages/wdio-sync')
    coveragePathIgnorePatterns.push('/packages/wdio-sync')
}

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
            branches: 85.15,
            functions: 92,
            lines: 94.34,
            statements: 94.19
        }
    },
    testEnvironment: 'node',
    coveragePathIgnorePatterns,
    resolver: `${__dirname}/tests/resolver.js`,
}
