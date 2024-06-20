import { test, expect } from 'vitest'
import DevtoolsGatherer from '../../src/gatherer/devtools.js'

test('getLogs', () => {
    const gatherer = new DevtoolsGatherer()
    gatherer.onMessage(1 as any)
    gatherer.onMessage(2 as any)
    gatherer.onMessage(3 as any)
    gatherer.onMessage(4 as any)

    expect(gatherer['_logs']).toHaveLength(4)

    const logs = gatherer.getLogs()
    expect(logs).toEqual([1, 2, 3, 4])
    expect(gatherer['_logs']).toHaveLength(0)
})
