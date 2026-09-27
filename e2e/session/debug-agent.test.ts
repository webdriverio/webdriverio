import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, waitFor, type FixtureServer, type Project, type BackgroundRun } from './helpers.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

function writeRun (project: Project, specSource: string) {
    const modules = path.join(project.dir, 'node_modules')
    if (!fs.existsSync(modules)) {
        fs.symlinkSync(path.resolve(__dirname, '..', 'node_modules'), modules)
    }
    const spec = path.join(project.dir, 'debug.e2e.ts')
    fs.writeFileSync(spec, specSource)
    fs.writeFileSync(path.join(project.dir, 'wdio.conf.ts'), `
export const config = {
    runner: 'local',
    specs: [${JSON.stringify(spec)}],
    maxInstances: 1,
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu', '--window-size=1280,720'] }
    }],
    logLevel: 'error',
    framework: 'mocha',
    mochaOpts: { timeout: 20000 },
    waitforTimeout: 10000
}
`)
}

async function untilPaused (project: Project, run: BackgroundRun) {
    const appeared = await waitFor(async () => {
        const list = await project.run(['list', '--json'])
        const sessions = list.json?.result?.data?.sessions as { name: string }[] | undefined
        return Boolean(sessions?.some((session) => session.name === 'debug-0-0'))
    }, 30_000, 250)
    expect(appeared, `${run.stdout()}\n${run.stderr()}`).toBe(true)
    expect(run.stderr()).toContain('Paused in')
    expect(run.stderr()).toContain('wdio session -s debug-0-0 snapshot')
    expect(run.stderr()).toContain('wdio session -s debug-0-0 resume')
}

describe('wdio run --debug=agent', () => {
    let server: FixtureServer
    let project: Project

    beforeAll(async () => {
        server = await startServer()
        project = createProject('debug-agent')
    })

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('pauses in browser.debug and resumes to a passing run', async () => {
        writeRun(project, `
describe('agent', () => {
    it('reads the title', async () => {
        await browser.url(${JSON.stringify(`${server.url}/index.html`)})
        await browser.debug()
        const title = await browser.getTitle()
        if (title !== 'Session Fixture') {
            throw new Error('title was ' + title)
        }
    })
})
`)
        const run = project.start(['run', 'wdio.conf.ts', '--debug=agent'])
        try {
            await untilPaused(project, run)
            const exec = await project.run(['exec', '-s', 'debug-0-0', '-e', 'await browser.getTitle()'])
            expect(exec.code, exec.stdout + exec.stderr).toBe(0)
            expect(exec.stdout).toContain('Session Fixture')
            const resume = await project.run(['resume', '-s', 'debug-0-0'])
            expect(resume.code, resume.stderr).toBe(0)
            const done = await run.result
            expect(done.code, done.stdout + done.stderr).toBe(0)
        } finally {
            run.kill()
            await run.result
        }
    })

    it('pauses after a failing test, then resume exits 1', async () => {
        writeRun(project, `
describe('agent', () => {
    it('fails the assertion', async () => {
        await browser.url(${JSON.stringify(`${server.url}/index.html`)})
        const title = await browser.getTitle()
        if (title === 'Session Fixture') {
            throw new Error('expected a failure')
        }
    })
})
`)
        const run = project.start(['run', 'wdio.conf.ts', '--debug=agent'])
        try {
            await untilPaused(project, run)
            const snapshot = await project.run(['snapshot', '-s', 'debug-0-0'])
            expect(snapshot.code, snapshot.stdout + snapshot.stderr).toBe(0)
            expect(snapshot.stdout).toContain('Welcome')
            const resume = await project.run(['resume', '-s', 'debug-0-0'])
            expect(resume.code, resume.stderr).toBe(0)
            const done = await run.result
            expect(done.code, done.stdout + done.stderr).toBe(1)
        } finally {
            run.kill()
            await run.result
        }
    })
})
