import { runConfig } from '../src/commands/config'
import { renderConfigurationFile } from '../src/utils'

jest.mock('../src/utils.js', () => ({
    renderConfigurationFile: jest.fn(),
    convertPackageHashToObject: () => {
        return {
            package: 'mocha',
            short: 'mocha'
        }
    },
    addServiceDeps: jest.fn()
}))

test('runConfig with yes param', async () => {
    await runConfig(false, true, true)
    expect(renderConfigurationFile).toHaveBeenCalledWith({
        'backend': 'On my local machine',
        'baseUrl': 'http://localhost',
        'executionMode': 'sync',
        'framework': 'mocha',
        'packagesToInstall': [
            'mocha',
            'mocha',
            'mocha',
            'mocha',
            '@wdio/sync',
        ],
        'reporters': [
            'mocha',
        ],
        'runner': 'mocha',
        'services': [
            'mocha',
        ],
        'specs': './test/specs/**/*.js',
    })
})