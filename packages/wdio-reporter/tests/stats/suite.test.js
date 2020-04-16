import SuiteStats from '../../src/stats/suite'

test('should get initialised', () => {
    const suite = new SuiteStats({
        cid: '0-0',
        title: 'foobar',
        fullTitle: 'barfoo',
        description: 'some description',
        tags: ['foo', 'bar']
    })

    delete suite.start
    expect(suite).toMatchSnapshot()
})
