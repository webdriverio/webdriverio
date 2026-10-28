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
        isMultiRemote: false
    })

    expect(runner.type).toBe('runner')
    expect(runner.cid).toBe('0-0')
    expect(runner.capabilities).toEqual(capabilities)
    expect(runner.config).toEqual(config)
    expect(runner.specs).toEqual(specs)
})

test('gives the attempt of a spec file with specFileRetries, 0 for the first one', () => {
    const attempt = (retry: number | undefined, specFileRetries?: number) => new RunnerStats({
        cid: '0-0', capabilities: {}, instanceOptions: {}, sessionId: 's', specs: [], isMultiRemote: false,
        config: { capabilities: {}, ...(specFileRetries !== undefined && { specFileRetries }) }, retry
    } as never).specFileAttempt
    // the launcher does not know the retries of the first attempt: the runner gives it specFileRetries + 1
    expect([attempt(2, 1), attempt(1, 1)]).toEqual([0, 1])
    expect([attempt(3, 2), attempt(1, 2), attempt(2, 2)]).toEqual([0, 1, 2])
    // with no specFileRetries the runner gives 1
    expect([attempt(1), attempt(1, 0), attempt(undefined)]).toEqual([0, 0, 0])
})
