import EventEmitter from 'events'
import NetworkHandler from '../src/handler/network'

import eventLog from './__fixtures__/events.json'

class MyEmitter extends EventEmitter {}

test('network handler', () => {
    const cdpMock = new MyEmitter()
    const handler = new NetworkHandler(cdpMock)

    eventLog.forEach((log) => {
        if (!log.method) {
            return
        }

        cdpMock.emit(log.method, log.params)
    })

    expect(handler.requestTypes).toEqual({
        Document: { size: 24714, encoded: 0, count: 1 },
        Other: { size: 311, encoded: 311, count: 7 }
    })
})
