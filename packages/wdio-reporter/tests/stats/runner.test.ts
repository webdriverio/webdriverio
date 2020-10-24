import RunnerStats from '../../src/stats/runner'

test('should get initialised', () => {
    const capabilities = { browserName: 'chrome' }
    const config = { outputDir: 'foo', logFile: 'bar' }
    const specs = ['./foo/bar.js']
    const runner = new RunnerStats({
        cid: '0-0',
        capabilities,
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
