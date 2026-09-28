import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

const WDIO_BIN = path.resolve(__dirname, '..', '..', 'packages', 'wdio-cli', 'bin', 'wdio.js')

function runWdio (cwd: string, args: string[]) {
    return new Promise<{ code: number, stdout: string, stderr: string }>((resolve, reject) => {
        const child = spawn(process.execPath, [WDIO_BIN, 'run', ...args], {
            cwd,
            env: { ...process.env, NO_COLOR: '1' }
        })
        let stdout = ''
        let stderr = ''
        child.stdout.on('data', (d) => (stdout += d))
        child.stderr.on('data', (d) => (stderr += d))
        const timer = setTimeout(() => {
            child.kill('SIGKILL')
            reject(new Error(`wdio run timed out\n${stdout}\n${stderr}`))
        }, 120_000)
        child.on('close', (code) => {
            clearTimeout(timer)
            resolve({ code: code ?? 1, stdout, stderr })
        })
    })
}

describe('wdio session history and export', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }
    const refOf = async (line: string) => {
        const text = (await run('snapshot')).stdout
        const ref = text.split('\n').find((l) => l.includes(line))?.match(/\[ref=(e\d+)\]/)?.[1]
        expect(ref, text).toBeTruthy()
        return ref!
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('export')
        fs.symlinkSync(path.resolve(__dirname, '..', 'node_modules'), path.join(project.dir, 'node_modules'))
        await run('open', 'chrome', `${server.url}/cart.html`)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('records steps, skips failures and --no-history, and clears', async () => {
        const listed = await run('history', '--json')
        expect(listed.json.result.data.entries.map((e: { kind: string }) => e.kind)).toContain('open')
        const before = listed.json.result.data.entries.length
        const failed = await project.run(['exec', '-e', 'throw new Error("nope")'])
        expect(failed.code).toBe(1)
        await run('exec', '-e', '1 + 1', '--no-history')
        const after = await run('history', '--json')
        expect(after.json.result.data.entries).toHaveLength(before)
        await run('history', '--clear')
        expect((await run('history')).stdout).toBe('No steps recorded.\n')
    })

    it('exports a spec that runs, and the same with page objects', async () => {
        await run('navigate', `${server.url}/cart.html`)
        const add = await refOf('button "Add to cart"')
        const checkout = await refOf('button "Checkout"')
        expect(add).toBe('e3')
        await run('click', add)
        await run('exec', '-e', `await expect(ref('${checkout}')).toBeDisplayed()`)

        const spec = path.join(project.dir, 'cart.e2e.ts')
        const exported = await run('export', '--out', spec, '--title', 'cart')
        expect(exported.stdout).toContain(spec)
        const source = fs.readFileSync(spec, 'utf-8')
        expect(source).not.toContain('ref(')
        expect(source).toContain('browser.url')
        expect(source).toMatch(/\$\([^)]+\)\.click\(\)/)
        expect(source).toContain('toBeDisplayed()')

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
    baseUrl: ${JSON.stringify(server.url)},
    framework: 'mocha',
    mochaOpts: { timeout: 60000 },
    waitforTimeout: 10000
}
`)
        const first = await runWdio(project.dir, ['wdio.conf.ts', '--spec', spec])
        expect(first.code, first.stdout + first.stderr).toBe(0)

        const po = path.join(project.dir, 'cart.po.e2e.ts')
        await run('export', '--out', po, '--title', 'cart', '--page-objects')
        const page = path.join(project.dir, 'pageobjects', 'Cart.page.ts')
        expect(fs.existsSync(page)).toBe(true)
        const poSource = fs.readFileSync(po, 'utf-8')
        expect(poSource).toContain("import CartPage from './pageobjects/Cart.page.ts'")
        expect(poSource).not.toContain('ref(')
        const second = await runWdio(project.dir, ['wdio.conf.ts', '--spec', po])
        expect(second.code, second.stdout + second.stderr).toBe(0)
    })
})
