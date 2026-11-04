import { expect } from '@wdio/globals'
import { mock } from '@wdio/browser-runner'

import { format } from './worker/format.js'

/**
 * a `mock()` call makes the runner rewrite the imports of every module the
 * spec loads, including the modules a web worker loads (#11575). The modules
 * live outside `__fixtures__/` because the runner does not rewrite imports there.
 */
mock('./worker/constants.js', () => ({
    PREFIX: 'mocked'
}))

function runWorker () {
    return new Promise<string>((resolve, reject) => {
        const worker = new Worker(new URL('./worker/format.worker.js', import.meta.url), { type: 'module' })
        worker.addEventListener('message', (ev) => {
            worker.terminate()
            resolve(ev.data)
        })
        worker.addEventListener('error', (ev) => {
            ev.preventDefault()
            worker.terminate()
            reject(new Error(`web worker failed: ${ev.message}`))
        })
    })
}

describe('web workers in a spec that mocks modules', () => {
    it('applies the mock in the test page', () => {
        expect(format('page')).toBe('mocked page')
    })

    it('loads the actual modules in a web worker', async () => {
        expect(await runWorker()).toBe('test worker')
    })
})
