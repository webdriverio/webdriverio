import WDIOReporter from '../src'
import tmp from 'tmp'
import TestStats from '../src/stats/test'

describe('WDIOReporter Listeners', () => {
    let stat
    let reporter
    let spy
    let spy2

    beforeEach(() => {
        stat = { type: 'test:start',
            title: 'should can do something',
            parent: 'My awesome feature',
            fullTitle: 'My awesome feature should can do something',
            pending: false,
            cid: '0-0',
            specs: [ '/path/to/test/specs/sync.spec.js' ],
            uid: '0-0'
        }

        stat.complete = jest.fn()
    })

    beforeEach(() => {
        const tmpobj = tmp.fileSync()
        reporter = new WDIOReporter({ logFile: tmpobj.name })
    })

    describe('Pending Listener', () => {
        beforeEach(() => {
            spy = jest.spyOn(WDIOReporter.prototype, 'onTestSkip')
            spy2 = jest.spyOn(TestStats.prototype, 'skip')
        })

        afterEach(() => {
            spy.mockClear()
            spy2.mockClear()
        })

        it('should add a pending test to the test list', () => {
            reporter.emit('test:pending', stat)
            expect(reporter.tests).toHaveProperty(stat.uid)
            expect(reporter.counts.skipping).toEqual(1)
            expect(reporter.counts.tests).toEqual(1)
            expect(spy).toHaveBeenCalledTimes(1)
            expect(spy2).toHaveBeenCalledTimes(1)
        })
    
        it('should allow Mocha pending tests with same UID to be added to other tests ', () => {
            const stats = []
            stat.uid = '0-0-0'
            stats.push(Object.assign({}, stat))
            stat.uid = '0-0-1'
            stats.push(Object.assign({}, stat))
            stat.uid = '0-0-2'
            stats.push(Object.assign({}, stat))
    
            reporter.emit('test:start', stats[0])
            reporter.emit('test:pass', stats[0])
            reporter.emit('test:start', stats[1])
            reporter.emit('test:fail', stats[1])
    
            // If new uid is not generated for pending test
            reporter.emit('test:pending', stats[1])

            reporter.emit('test:pending', stats[2])

            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy2).toHaveBeenCalledTimes(2)

            // Make sure all tests are present
            expect(reporter.tests).toHaveProperty(stats[0].uid)
            expect(reporter.tests).toHaveProperty(stats[1].uid)
            expect(reporter.tests).toHaveProperty('skipped-0')
            expect(reporter.tests).toHaveProperty(stats[2].uid)

            // Make sure there are only 4 tests
            expect(Object.keys(reporter.tests).length).toEqual(4)
    
            // Make sure all tests have the right state
            expect(reporter.tests[stats[0].uid].state).toEqual('passed')
            expect(reporter.tests[stats[1].uid].state).toEqual('failed')
            expect(reporter.tests['skipped-0'].state).toEqual('skipped')
            expect(reporter.tests[stats[2].uid].state).toEqual('skipped')

            // Make sure all tests are in the suite
            expect(reporter.currentSuites[0].tests.length).toEqual(4)
            expect(reporter.currentSuites[0].tests[0].uid).toEqual(stats[0].uid)
            expect(reporter.currentSuites[0].tests[1].uid).toEqual(stats[1].uid)
            expect(reporter.currentSuites[0].tests[2].uid).toEqual('skipped-0')
            expect(reporter.currentSuites[0].tests[3].uid).toEqual(stats[2].uid)
    
            // Make sure the counts are updated
            expect(reporter.counts.skipping).toEqual(2)
            expect(reporter.counts.tests).toEqual(4)
        })

        it('should allow Jasmine pending tests to be added to the test list', () => {
            const stats = []
            stat.uid = '0-0-0'
            stats.push(Object.assign({}, stat))
            stat.uid = '0-0-1'
            stats.push(Object.assign({}, stat))
            stat.uid = '0-0-2'
            stats.push(Object.assign({}, stat))
    
            reporter.emit('test:start', stats[0])
            reporter.emit('test:pass', stats[0])
            reporter.emit('test:start', stats[1])
            reporter.emit('test:fail', stats[1])
            reporter.emit('test:start', stats[2])
            reporter.emit('test:pending', stats[2])

            expect(spy).toHaveBeenCalledTimes(1)
            expect(spy2).toHaveBeenCalledTimes(1)

            // Make sure all tests are present
            expect(reporter.tests).toHaveProperty(stats[0].uid)
            expect(reporter.tests).toHaveProperty(stats[1].uid)
            expect(reporter.tests).toHaveProperty(stats[2].uid)

            // Make sure there are only 3 tests
            expect(Object.keys(reporter.tests).length).toEqual(3)
            expect(reporter.tests).not.toHaveProperty('skipped-0')

            // Make sure all tests have the right state
            expect(reporter.tests[stats[0].uid].state).toEqual('passed')
            expect(reporter.tests[stats[1].uid].state).toEqual('failed')
            expect(reporter.tests[stats[2].uid].state).toEqual('skipped')

            // Make sure all tests are in the suite
            expect(reporter.currentSuites[0].tests.length).toEqual(3)
            expect(reporter.currentSuites[0].tests[0].uid).toEqual(stats[0].uid)
            expect(reporter.currentSuites[0].tests[1].uid).toEqual(stats[1].uid)
            expect(reporter.currentSuites[0].tests[2].uid).toEqual(stats[2].uid)

            // Make sure the counts are updated
            expect(reporter.counts.skipping).toEqual(1)
            expect(reporter.counts.tests).toEqual(3)
        })
    })
})