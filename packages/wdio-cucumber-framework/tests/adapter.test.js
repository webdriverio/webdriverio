import CucumberAdapterFactory, { CucumberAdapter } from '../src/index'

test('comes with a factory', async () => {
    expect(typeof CucumberAdapterFactory.run).toBe('function')
    const result = await CucumberAdapterFactory.run(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome'},
        null
    )
    expect(result).toBe(0)
})
