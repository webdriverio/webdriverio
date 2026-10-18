import { test, expect } from 'vitest'
import RunnerStats from '../../src/stats/runner.js'

test('should get initialized', () => {
    const capabilities = { browserName: 'chrome' }
    const config = { outputDir: 'foo', logFile: 'bar', capabilities: {} }
    const specs = ['./foo/bar.js']
    const runner = new RunnerStats({
        cid: '0-0',
        capabilities,
        instanceOptions: {
            'some-sessionId': config
        },
        sessionId: 'some-sessionId',
        config,
        specs,
        isMultiremote: false
    })

    expect(runner.type).toBe('runner')
    expect(runner.cid).toBe('0-0')
    expect(runner.capabilities).toEqual(capabilities)
    expect(runner.config).toEqual(config)
    expect(runner.specs).toEqual(specs)
})

test('should expose isMultiRemote with the value of isMultiremote', () => {
    const config = { outputDir: 'foo', logFile: 'bar', capabilities: {} }
    for (const isMultiremote of [true, false]) {
        const runner = new RunnerStats({
            cid: '0-0',
            capabilities: { browserName: 'chrome' },
            instanceOptions: {},
            sessionId: 'some-sessionId',
            config,
            specs: ['./foo/bar.js'],
            isMultiremote
        })
        expect(runner.isMultiRemote).toBe(isMultiremote)
    }
})
