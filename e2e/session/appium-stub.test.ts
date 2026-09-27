import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, type Project } from './helpers.js'
import { startAppiumStub, type AppiumStub } from './stub/appium.js'

describe('wdio session against an Appium stub', () => {
    let stub: AppiumStub
    let project: Project
    const app = path.join(os.tmpdir(), 'x.apk')

    const recorded = () => stub.requests

    beforeAll(async () => {
        fs.writeFileSync(app, '')
        stub = await startAppiumStub()
        project = createProject('appium-stub')
        const open = await project.run(['open', 'android', '--appium-url', stub.url, '--app', app])
        expect(open.code, open.stdout + open.stderr).toBe(0)
    }, 60_000)

    afterAll(async () => {
        await project?.cleanup()
        await stub?.close()
        fs.rmSync(app, { force: true })
    })

    it('renders the stub Android page source', async () => {
        const snap = await project.run(['snapshot'])
        expect(snap.code, snap.stderr).toBe(0)
        expect(snap.stdout).toContain('button "save"')
        expect(snap.stdout).toContain('textbox "Email"')
        expect(recorded().some((req) => req.method === 'GET' && req.path.endsWith('/source'))).toBe(true)
    })

    it('taps a ref with its stable selector and a click', async () => {
        const before = recorded().length
        const tap = await project.run(['tap', 'e2'])
        expect(tap.code, tap.stderr).toBe(0)
        const sent = recorded().slice(before)
        const find = sent.find((req) => req.method === 'POST' && req.path.endsWith('/elements') && req.body?.using === 'id' && req.body?.value === 'com.example:id/email')
        expect(find, JSON.stringify(sent, null, 2)).toBeTruthy()
        const click = sent.find((req) =>
            req.path.endsWith('/click') ||
            (req.path.endsWith('/execute/sync') && String(req.body?.script || '').includes('click'))
        )
        expect(click, JSON.stringify(sent, null, 2)).toBeTruthy()
    })

    it('swipes with a pointer action sequence', async () => {
        const before = recorded().length
        const swipe = await project.run(['swipe', 'up'])
        expect(swipe.code, swipe.stderr).toBe(0)
        const actions = recorded().slice(before).find((req) => req.method === 'POST' && req.path.endsWith('/actions'))
        expect(actions, JSON.stringify(recorded().slice(before), null, 2)).toBeTruthy()
        expect(JSON.stringify(actions!.body)).toContain('pointer')
    })

    it('queries app state through mobile: queryAppState', async () => {
        const before = recorded().length
        const state = await project.run(['app', 'state', 'com.x'])
        expect(state.code, state.stderr).toBe(0)
        expect(state.stdout).toContain('com.x: foreground')
        const call = recorded().slice(before).find((req) => req.path.endsWith('/execute/sync') && req.body?.script === 'mobile: queryAppState')
        expect(call, JSON.stringify(recorded().slice(before), null, 2)).toBeTruthy()
        expect(JSON.stringify(call!.body.args)).toContain('com.x')
    })

    it('switches context', async () => {
        const before = recorded().length
        const switched = await project.run(['contexts', 'switch', 'WEBVIEW_1'])
        expect(switched.code, switched.stderr).toBe(0)
        const call = recorded().slice(before).find((req) => req.method === 'POST' && /\/context$/.test(req.path))
        expect(call?.body).toMatchObject({ name: 'WEBVIEW_1' })
    })
})
