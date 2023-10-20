import { vi } from 'vitest'

export class ConfigParser {
    addService = vi.fn()
    initialize = vi.fn()
    addConfigFile = vi.fn()
    merge = vi.fn()
    autoCompile = vi.fn()

    getConfig = vi.fn().mockReturnValue({
        runnerEnv: {},
        shard: { current: 1, total: 1 },
        runner: 'local',
        outputDir: './tempDir'
    })

    getCapabilities = vi.fn().mockReturnValue([{
        browserName: 'chrome',
        specs: ['./tests/test2.js']
    }, {
        browserName: 'firefox'
    }])

    getSpecs = vi.fn().mockReturnValue(['./tests/test1.js'])
}
