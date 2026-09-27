import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

describe('wdio session trace and record', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}\n${res.stdout}`).toBe(0)
        return res
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('evidence')
        await run('open', 'chrome', `${server.url}/cart.html`)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('writes a transcript, a screenshot and a snapshot for each step', async () => {
        const snap = (await run('snapshot', '--interactive')).stdout
        const add = snap.split('\n').find((line) => line.includes('button "Add to cart"'))?.match(/\[ref=(e\d+)\]/)?.[1]
        expect(add, snap).toBeTruthy()
        await run('trace', 'start')
        await run('click', add!)
        await run('exec', '-e', 'await browser.getTitle()')
        const stopped = await run('trace', 'stop')
        const transcript = stopped.stdout.split('\n').find((line) => line.endsWith('transcript.md'))?.trim()
        expect(transcript, stopped.stdout).toBeTruthy()
        const markdown = fs.readFileSync(transcript!, 'utf-8')
        const clickAt = markdown.indexOf('## Step 1 — click')
        const execAt = markdown.indexOf('## Step 2 — exec')
        expect(clickAt).toBeGreaterThanOrEqual(0)
        expect(execAt).toBeGreaterThan(clickAt)
        const resources = path.join(path.dirname(transcript!), 'resources')
        const png = fs.readFileSync(path.join(resources, 'step-1.png'))
        expect(png.subarray(0, 4).toString('hex')).toBe('89504e47')
        expect(fs.readFileSync(path.join(resources, 'step-1-snapshot.txt'), 'utf-8')).toMatch(/\[ref=e\d+\]/)
        const ndjson = fs.readFileSync(path.join(path.dirname(transcript!), 'trace.trace'), 'utf-8').trim().split('\n').map((line) => JSON.parse(line))
        expect(ndjson.map((line: { type: string, action: string }) => `${line.type}:${line.action}`)).toEqual([
            'before:click', 'after:click', 'before:exec', 'after:exec'
        ])
    })

    it('records frames and encodes a video when ffmpeg is available', async () => {
        await run('record', 'start')
        await run('snapshot')
        await run('exec', '-e', '1 + 1')
        await run('reload')
        const stopped = await run('record', 'stop')
        const video = stopped.stdout.split('\n')[0].replace(/^Recorded /, '').trim()
        expect(fs.statSync(video).size, stopped.stdout).toBeGreaterThan(0)
        expect(stopped.stdout, stopped.stdout).toContain('frames in')
        const framesDir = stopped.stdout.split('frames in ')[1].trim()
        const frames = fs.readdirSync(framesDir).filter((name) => name.endsWith('.png'))
        expect(frames.length).toBeGreaterThanOrEqual(2)
        const duration = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], { encoding: 'utf-8' })
        expect(Number(duration)).toBeGreaterThan(0)
    })
})