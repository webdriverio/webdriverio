import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import mergeResults from '../src/mergeResults.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const fixturesDir = path.resolve(__dirname, '__fixtures__')

async function copyFixtures () {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-json-reporter-'))
    const files = await fs.readdir(fixturesDir)
    await Promise.all(files.map((file) => fs.copyFile(path.join(fixturesDir, file), path.join(dir, file))))
    return dir
}

describe('mergeResults', () => {
    const dirs: string[] = []

    afterEach(async () => {
        await Promise.all(dirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
    })

    it('should merge json result correctly', async () => {
        const dir = await copyFixtures()
        dirs.push(dir)

        const result = await mergeResults(dir, 'wdio-.*.json')
        expect(result.capabilities).toHaveLength(2)
        expect(result.specs).toHaveLength(2)
        expect(result.suites).toHaveLength(2)
    })

    it('should write wdio-merged.json when no custom filename is given', async () => {
        const dir = await copyFixtures()
        dirs.push(dir)

        const result = await mergeResults(dir, 'wdio-.*-json-reporter\\.json')
        const written = JSON.parse(await fs.readFile(path.join(dir, 'wdio-merged.json'), 'utf8'))

        expect(written).toEqual(result)
        expect(await fs.readdir(fixturesDir)).not.toContain('wdio-merged.json')
    })

    it('should write the custom filename when one is given', async () => {
        const dir = await copyFixtures()
        dirs.push(dir)

        const result = await mergeResults(dir, 'wdio-.*-json-reporter\\.json', 'custom-results.json')
        const written = JSON.parse(await fs.readFile(path.join(dir, 'custom-results.json'), 'utf8'))

        expect(written).toEqual(result)
        await expect(fs.access(path.join(dir, 'wdio-merged.json'))).rejects.toThrow()
    })

    it('should merge a lone raw report named wdio-merged.json', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-json-reporter-'))
        dirs.push(dir)
        await fs.copyFile(
            path.join(fixturesDir, 'wdio-0-0-json-reporter.json'),
            path.join(dir, 'wdio-merged.json')
        )

        const result = await mergeResults(dir, 'wdio-.*.json')

        expect(result.suites).toHaveLength(1)
        expect(Array.isArray(result.capabilities)).toBe(true)
        expect(result.capabilities).toHaveLength(1)
    })

    it('should merge a raw report that uses the default output filename', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-json-reporter-'))
        dirs.push(dir)
        await fs.copyFile(
            path.join(fixturesDir, 'wdio-0-0-json-reporter.json'),
            path.join(dir, 'wdio-merged.json')
        )
        await fs.copyFile(
            path.join(fixturesDir, 'wdio-0-1-json-reporter.json'),
            path.join(dir, 'wdio-0-1-json-reporter.json')
        )

        const result = await mergeResults(dir, 'wdio-.*.json')
        const written = JSON.parse(await fs.readFile(path.join(dir, 'wdio-merged.json'), 'utf8'))

        expect(result.suites).toHaveLength(2)
        expect(result.capabilities).toHaveLength(2)
        expect(written).toEqual(result)
    })

    it('should keep an existing merged report when no raw reports match', async () => {
        const dir = await copyFixtures()
        dirs.push(dir)

        const first = await mergeResults(dir, 'wdio-.*-json-reporter\\.json')
        for (const file of await fs.readdir(dir)) {
            if (file !== 'wdio-merged.json') {
                await fs.rm(path.join(dir, file))
            }
        }

        const second = await mergeResults(dir, 'wdio-.*-json-reporter\\.json')
        const written = JSON.parse(await fs.readFile(path.join(dir, 'wdio-merged.json'), 'utf8'))

        expect(second).toEqual(first)
        expect(written).toEqual(first)
    })

    it('should ignore a previous merged report when the pattern would match it', async () => {
        const dir = await copyFixtures()
        dirs.push(dir)

        const first = await mergeResults(dir, 'wdio-.*.json')
        const second = await mergeResults(dir, 'wdio-.*.json')

        expect(second.suites).toHaveLength(first.suites.length)
        expect(second.capabilities).toHaveLength(first.capabilities.length)
        expect(second.specs).toHaveLength(first.specs.length)
    })
})
