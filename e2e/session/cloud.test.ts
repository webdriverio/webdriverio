import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, type Project } from './helpers.js'
import { startAppiumStub, type AppiumStub } from './stub/appium.js'

describe('cloud provider session', () => {
    let stub: AppiumStub
    let project: Project

    beforeAll(async () => {
        stub = await startAppiumStub()
        project = createProject('cloud')
        const open = await project.run(
            ['open', 'chrome', '--provider', 'browserstack', '--hostname', '127.0.0.1', '--port', String(stub.port), '--os', 'Windows', '--os-version', '11'],
            { env: { BROWSERSTACK_USERNAME: 'bs-user', BROWSERSTACK_ACCESS_KEY: 'bs-key' } }
        )
        expect(open.code, open.stdout + open.stderr).toBe(0)
    }, 60_000)

    afterAll(async () => {
        await project?.cleanup()
        await stub?.close()
    })

    it('sends bstack:options with the credentials from the environment', () => {
        const created = stub.requests.find((req) => req.method === 'POST' && req.path === '/session')
        expect(created, JSON.stringify(stub.requests, null, 2)).toBeTruthy()
        const options = created!.body?.capabilities?.alwaysMatch?.['bstack:options']
        expect(options).toMatchObject({
            userName: 'bs-user',
            accessKey: 'bs-key',
            os: 'Windows',
            osVersion: '11'
        })
    })
})
