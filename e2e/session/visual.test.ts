import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

function pngs (dir: string): string[] {
    if (!fs.existsSync(dir)) {
        return []
    }
    return fs.readdirSync(dir).filter((name) => name.endsWith('.png')).map((name) => path.join(dir, name))
}

describe('wdio session visual', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}\n${res.stdout}`).toBe(0)
        return res
    }
    const refOf = async (line: string) => {
        const text = (await run('snapshot', '--interactive')).stdout
        const ref = text.split('\n').find((l) => l.includes(line))?.match(/\[ref=(e\d+)\]/)?.[1]
        expect(ref, text).toBeTruthy()
        return ref!
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('visual')
        const visualPkg = path.resolve(__dirname, '..', '..', 'packages', 'wdio-session', 'node_modules', '@wdio', 'visual-service')
        const dest = path.join(project.dir, 'node_modules', '@wdio')
        fs.mkdirSync(dest, { recursive: true })
        fs.symlinkSync(visualPkg, path.join(dest, 'visual-service'))
        await run('open', 'chrome', `${server.url}/index.html`)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('saves, mismatches, accepts, creates a baseline, and compares one element', async () => {
        const baseline = path.join(project.dir, '.wdio', 'visual', 'baseline')
        const diffDir = path.join(project.dir, '.wdio', 'session', 'default', 'visual', 'diff')
        const saved = await run('visual', 'save', 'home')
        const found = pngs(baseline)
        expect(found.length, `${saved.stdout}\n${saved.stderr}`).toBeGreaterThan(0)
        expect(saved.stdout).toContain(baseline)

        await run('exec', '-e', "await browser.execute(() => { document.querySelector('h1').style.color = 'rgb(200, 0, 0)' })")
        const mismatched = await project.run(['visual', 'check', 'home', '--json'])
        expect(mismatched.code).toBe(1)
        expect(mismatched.json.error.code).toBe('VISUAL_MISMATCH')
        const mismatch = Number(mismatched.json.error.message.match(/mismatch ([\d.]+)%/)?.[1])
        expect(mismatch).toBeGreaterThan(0)
        expect(pngs(diffDir).length).toBeGreaterThan(0)

        await run('visual', 'accept', 'home')
        const matched = await run('visual', 'check', 'home')
        expect(matched.stdout).toContain('mismatch 0.00%')

        const created = await run('visual', 'check', 'fresh')
        expect(created.stdout).toContain('Baseline created')
        expect(created.code).toBe(0)

        const button = await refOf('button "Say hello"')
        await run('visual', 'save', 'hello', '--element', button)
        await run('exec', '-e', "await browser.execute(() => { document.querySelector('p').style.color = 'rgb(0, 0, 200)' })")
        const element = await run('visual', 'check', 'hello', '--element', button)
        expect(element.stdout).toContain('mismatch 0.00%')

        const listed = await run('visual', 'list', '--json')
        const tags = listed.json.result.data.tags.map((tag: { tag: string }) => tag.tag)
        expect(tags).toEqual(expect.arrayContaining(['home', 'fresh', 'hello']))
    }, 90_000)
})