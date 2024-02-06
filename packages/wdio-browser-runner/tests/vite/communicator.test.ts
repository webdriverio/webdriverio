import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { MESSAGE_TYPES } from '@wdio/types'

import { ServerWorkerCommunicator } from '../../src/communicator.js'
import { SESSIONS } from '../../src/constants.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('ServerWorkerCommunicator', () => {
    it('should register server and worker', () => {
        const server: any = { onBrowserEvent: vi.fn() }
        const worker: any = { on: vi.fn() }
        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server, worker)
        expect(server.onBrowserEvent).toBeCalledTimes(1)
        expect(worker.on).toBeCalledTimes(1)
    })

    it('onWorkerMessage and onBrowserEvent handling', async () => {
        const server: any = { onBrowserEvent: vi.fn() }
        const worker: any = { on: vi.fn(), postMessage: vi.fn() }
        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server, worker)
        const onWorkerMessage = worker.on.mock.calls[0][1]

        expect(SESSIONS.size).toBe(0)
        await onWorkerMessage({ name: 'sessionStarted', cid: '0-0', content: { capabilities: {} } }, {}, {})
        expect(SESSIONS.size).toBe(1)
        await onWorkerMessage({ name: 'sessionEnded', cid: '0-0' }, {}, {})
        expect(SESSIONS.size).toBe(0)
        expect(communicator.coverageMaps).toHaveLength(0)
        await onWorkerMessage({ name: 'workerEvent', args: { type: MESSAGE_TYPES.coverageMap } }, {}, {})
        expect(communicator.coverageMaps).toHaveLength(1)

        const onBrowserEvent = server.onBrowserEvent.mock.calls[0][0]
        const client = { send: vi.fn().mockReturnValue('some value') }
        onBrowserEvent({ type: 'foobar' }, client)
        expect(
            await onWorkerMessage({ name: 'workerResponse', args: { id: 123, message: {} } }, {}, {})
        ).toBe(undefined)
        expect(
            await onWorkerMessage({ name: 'workerResponse', args: { id: 0, message: {} } }, {}, {})
        ).toBe('some value')
    })
})
