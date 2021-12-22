module.exports = {
    testRunner: 'jest-circus/runner',
    testEnvironment: 'node',
    testMatch: [
        '<rootDir>/**/*.test.(js|ts)'
    ],
    moduleFileExtensions: ['js', 'ts'],
    setupFilesAfterEnv: ['./jest.setup.js'],
    transform: {
        '^.+\\.(ts|js)$': 'ts-jest'
    }
}
