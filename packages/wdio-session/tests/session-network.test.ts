import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { IMPLEMENTATIONS } from '../src/actions/index.js'
import { Session } from '../src/session.js'
import type { OpenPlan } from '../src/types.js'

const NOTE = 'Requests failed: ERR GET shop.test/api'
const dirs: string[] = []
const original = { ...IMPLEMENTATIONS }
const priorChanges = process.env.WDIO_SESSION_CHANGES

beforeEach(() => {
    process.env.WDIO_SESSION_CHANGES = '0'
    for (const action of ['click', 'get', 'exec', 'snapshot', 'requests']) {
        IMPLEMENTATIONS[action] = async () => ({ text: action })
    }
})

afterEach(() => {
    Object.assign(IMPLEMENTATIONS, original)
    process.env.WDIO_SESSION_CHANGES = priorChanges
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

function session () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-session-net-'))
    dirs.push(dir)
    return new Session({
        name: 'test',
        cwd: dir,
        artifactsDir: path.join(dir, 'artifacts'),
        runtimeDir: dir,
        browser: { getUrl: async () => 'https://shop.test/', setTimeout: async () => {} } as unknown as WebdriverIO.Browser,
        plan: { applies: ['W'], platform: 'browser', label: 'Chrome', capabilities: {} } as unknown as OpenPlan,
        persistHistory: false
    })
}

const fail = (s: Session) => s.network.push({ time: 0, method: 'GET', url: 'https://shop.test/api', failed: true, errorText: 'net::ERR_FAILED', resource: 'fetch' })

describe('failed request notes', () => {
    it('never end up in the text of an action that returns a value', async () => {
        const s = session()
        fail(s)
        expect((await s.dispatch({ action: 'exec', args: {} })).text).toBe('exec')
        expect((await s.dispatch({ action: 'get', args: {} })).text).toBe('get')
    })

    it('are appended to the text of a click', async () => {
        const s = session()
        fail(s)
        expect((await s.dispatch({ action: 'click', args: {} })).text).toBe(`click\n${NOTE}`)
    })

    it('are carried as a note by any action in detail mode', async () => {
        const s = session()
        fail(s)
        const result = await s.dispatch({ action: 'get', args: {} }, { detail: true })
        expect(result.text).toBe('get')
        expect(result.notes).toEqual([NOTE])
    })

    it('arriving after a click are not consumed by a get, the next snapshot reports them', async () => {
        const s = session()
        await s.dispatch({ action: 'click', args: {} })
        fail(s)
        expect((await s.dispatch({ action: 'get', args: {} })).text).toBe('get')
        expect((await s.dispatch({ action: 'snapshot', args: {} })).text).toBe(`snapshot\n${NOTE}`)
        expect((await s.dispatch({ action: 'snapshot', args: {} })).text).toBe('snapshot')
    })

    it('are consumed by requests', async () => {
        const s = session()
        fail(s)
        await s.dispatch({ action: 'requests', args: {} })
        expect((await s.dispatch({ action: 'snapshot', args: {} })).text).toBe('snapshot')
    })
})
