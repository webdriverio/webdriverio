import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createServer } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'

const pages: Record<string, string> = {
    '/': `<!doctype html>
        <input id="file" type="file">
        <input id="files" type="file" multiple>
        <iframe id="frame" src="/frame"></iframe>`,
    '/frame': '<!doctype html><input id="framed" type="file">'
}

async function fileNames (element: WebdriverIO.Element) {
    return browser.execute((input: HTMLInputElement) => {
        return Array.from(input.files || [], (file) => file.name)
    }, element as unknown as HTMLInputElement)
}

describe('setFiles', () => {
    const server = createServer((request, response) => {
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(pages[request.url || '/'] || '')
    })
    let origin = ''
    let directory = ''
    let first = ''
    let second = ''

    before(async () => {
        directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-set-files-'))
        first = path.join(directory, 'one.txt')
        second = path.join(directory, 'two.txt')
        await fs.writeFile(first, 'one')
        await fs.writeFile(second, 'two')
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    after(async () => {
        const closed = new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve())
        })
        server.closeAllConnections()
        await closed
        if (directory) {
            await fs.rm(directory, { recursive: true, force: true })
        }
    })

    it('sets one file on a file input', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        await browser.url(`${origin}/`)
        const input = await $('#file')
        await input.setFiles(first)

        expect(await input.getValue()).toContain('one.txt')
        expect(await fileNames(input)).toEqual(['one.txt'])
    })

    it('sets multiple files', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        await browser.url(`${origin}/`)
        const input = await $('#files')
        await input.setFiles([first, second])

        expect(await fileNames(input)).toEqual(['one.txt', 'two.txt'])
    })

    it('sets a file input inside a frame', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        await browser.url(`${origin}/`)
        const frame = await $('iframe')
        await browser.switchFrame(frame)
        try {
            const input = await $('#framed')
            await input.waitForExist()
            await input.setFiles(first)
            expect(await fileNames(input)).toEqual(['one.txt'])
        } finally {
            await browser.switchFrame(null)
        }
    })
})
