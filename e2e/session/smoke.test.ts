import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { remote } from 'webdriverio'

import { ACTIONS } from '@wdio/session'

import { startServer, runSession, type FixtureServer } from './helpers.js'

describe('wdio session harness', () => {
    let server: FixtureServer

    beforeAll(async () => {
        server = await startServer()
    })

    afterAll(async () => {
        await server.close()
    })

    it('serves the fixture site to a headless Chrome', async () => {
        const browser = await remote({
            logLevel: 'warn',
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu'] }
            }
        })
        try {
            await browser.url(`${server.url}/index.html`)
            expect(await browser.getTitle()).toBe('Session Fixture')
        } finally {
            await browser.deleteSession()
        }
    })

    it('lists every action in --help', async () => {
        const { code, stdout } = await runSession(['--help'])
        expect(code).toBe(0)
        const listed = stdout.slice(stdout.indexOf('Actions:'), stdout.indexOf('Global flags:'))
        for (const action of ACTIONS) {
            expect(listed).toMatch(new RegExp(`(^|\\s)${action.name}(\\s|$)`))
        }
    })

    it('describes one action with <action> --help', async () => {
        const { code, stdout } = await runSession(['click', '--help'])
        expect(code).toBe(0)
        expect(stdout).toContain('wdio session click <target>')
        expect(stdout).toContain('Examples:')
    })

    it('fails with a usage error for unknown actions', async () => {
        const { code, stderr } = await runSession(['frobnicate'])
        expect(code).toBe(2)
        expect(stderr).toContain('Unknown')
    })
})
