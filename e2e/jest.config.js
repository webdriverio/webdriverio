module.exports = {
    testRunner: 'jest-circus/runner',
    testEnvironment: 'node',
    testMatch: [
        '<rootDir>/*.test.js'
    ],
    moduleFileExtensions: ['js', 'ts'],
    setupFilesAfterEnv: ['./jest.setup.js']
}
