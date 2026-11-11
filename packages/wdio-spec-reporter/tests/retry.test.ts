import { describe, expect, it, vi } from 'vitest'

import SpecReporter from '../src/index.js'

vi.mock('chalk')

// the real base reporter: its suite and test stats, as a sequential Cucumber run sends them
describe('spec reporter with Cucumber retry', () => {
    const scenario = { uid: 'scenario', title: 'Scenario', type: 'scenario', parent: 'Feature', cid: '0-0', file: '/k10.feature' }
    const step = (uid: string) => ({ uid, title: uid, type: 'test', cid: '0-0', fullTitle: uid })
    const runStep = (reporter: SpecReporter, uid: string, result: string) => {
        reporter.emit('test:start', step(uid))
        reporter.emit(result, step(uid))
        reporter.emit('test:end', step(uid))
    }

    // sequential mode: the steps have no parentUid, their scenario is the last suite that started
    it('removes the counts of a retried attempt from the summary in a sequential run', () => {
        const reporter = new SpecReporter({ writeStream: { write: vi.fn() } })
        reporter.emit('suite:start', { uid: 'feature', title: 'Feature', type: 'feature', cid: '0-0', file: '/k10.feature' })
        reporter.emit('suite:start', scenario)
        runStep(reporter, 's1', 'test:pass')
        runStep(reporter, 's2', 'test:retry')
        reporter.emit('suite:retry', scenario)
        runStep(reporter, 's1', 'test:pass')
        runStep(reporter, 's2', 'test:pass')
        reporter.emit('suite:end', scenario)
        reporter.emit('suite:end', { uid: 'feature' })

        expect(reporter.getCountDisplay('')).toEqual(['green 2 passing ', 'yellow 1 retried'])
    })
})
