import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * A process can load two copies of @wdio/logger, e.g. the copy that `geckodriver`
 * and `edgedriver` bring next to the one of WebdriverIO. Each copy opened
 * `WDIO_LOG_PATH` with its own stream: the second one emptied the file, and the
 * first kept writing at its old offset, which left NUL bytes.
 */
describe('log file shared by two copies of @wdio/logger', () => {
    let dir: string

    beforeEach(async () => {
        dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-logger-'))
        process.env.WDIO_LOG_PATH = path.join(dir, 'wdio.log')
    })

    afterEach(async () => {
        delete process.env.WDIO_LOG_PATH
        await fs.rm(dir, { recursive: true, force: true })
    })

    /**
     * `vi.resetModules()` reloads the logger but not `loglevel`, so both copies share
     * its registry of named loggers: give each test its own names
     */
    let names = 0
    const unique = (name: string) => `${name}-${++names}`

    async function loadCopy () {
        vi.resetModules()
        return (await import('../src/index.js')).default
    }

    /**
     * `clearLogger()` ends the stream; the file is complete once it has closed
     */
    async function closeAndRead (logger: Awaited<ReturnType<typeof loadCopy>>, file = process.env.WDIO_LOG_PATH!) {
        await logger.waitForBuffer()
        logger.clearLogger()
        await new Promise((resolve) => setTimeout(resolve, 50))
        return fs.readFile(file, 'utf8')
    }

    it('keeps the lines of both copies in one file', async () => {
        const [firstName, secondName] = [unique('first'), unique('second')]
        const first = await loadCopy()
        first(firstName).info('line from the first copy')
        await first.waitForBuffer()

        const second = await loadCopy()
        second(secondName).info('line from the second copy')
        first(firstName).info('another line from the first copy')

        const content = await closeAndRead(first)
        expect(content).not.toContain('\u0000')
        expect(content).toContain(`${firstName}: line from the first copy`)
        expect(content.indexOf(`${secondName}: line from the second copy`)).toBeGreaterThan(content.indexOf(`${firstName}: line from the first copy`))
        expect(content.indexOf(`${firstName}: another line from the first copy`)).toBeGreaterThan(content.indexOf(`${secondName}: line from the second copy`))
    })

    it('opens a new file when a copy uses another path', async () => {
        const [firstName, secondName] = [unique('first'), unique('second')]
        const first = await loadCopy()
        first(firstName).info('in wdio.log')
        await first.waitForBuffer()

        process.env.WDIO_LOG_PATH = path.join(dir, 'other.log')
        const second = await loadCopy()
        second(secondName).info('in other.log')

        expect(await closeAndRead(second, path.join(dir, 'other.log'))).toContain(`${secondName}: in other.log`)
        expect(await closeAndRead(first, path.join(dir, 'wdio.log'))).toContain(`${firstName}: in wdio.log`)
    })
})
