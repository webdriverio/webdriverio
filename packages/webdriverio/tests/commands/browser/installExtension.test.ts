import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { expect, describe, it, afterEach, vi } from 'vitest'
import JSZip from 'jszip'

import { remote } from '../../../src/index.js'

import '../../../src/node.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const created: string[] = []

async function bidiBrowser (options: Record<string, unknown> = {}) {
    const browser = await remote({
        baseUrl: 'http://foobar.com',
        port: 4444,
        ...options,
        capabilities: {
            browserName: 'bidi'
        }
    })
    vi.spyOn(browser, 'webExtensionInstall').mockResolvedValue({ extension: 'ext-id' })
    return browser
}

function tempArchive (name: string, contents = 'archive-bytes') {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-install-extension-'))
    const file = path.join(dir, name)
    fs.writeFileSync(file, contents)
    created.push(dir)
    return file
}

function tempDirectory () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-install-extension-'))
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
        manifest_version: 3,
        name: 'wdio-extension-fixture',
        version: '1.0.0'
    }))
    fs.mkdirSync(path.join(dir, 'nested'))
    fs.writeFileSync(path.join(dir, 'nested', 'note.txt'), 'nested')
    created.push(dir)
    return dir
}

describe('installExtension', () => {
    afterEach(() => {
        for (const entry of created.splice(0)) {
            fs.rmSync(entry, { force: true, recursive: true })
        }
    })

    it('throws on a classic session and names webExtension.install', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'chrome'
            }
        })

        await expect(browser.installExtension('./dist')).rejects.toThrow(
            'installExtension requires a WebDriver BiDi session (webExtension.install)'
        )
        expect(browser.isBidi).toBe(false)
    })

    it('maps a directory to a resolved path', async () => {
        const browser = await bidiBrowser()
        const id = await browser.installExtension('./dist')

        expect(id).toBe('ext-id')
        expect(browser.webExtensionInstall).toHaveBeenCalledWith({
            extensionData: {
                type: 'path',
                path: path.resolve('./dist')
            }
        })
    })

    it.each(['.zip', '.xpi', '.crx', '.ZIP'])('maps a %s archive to archivePath', async (ext) => {
        const browser = await bidiBrowser()
        const relative = `./ext${ext}`

        await browser.installExtension(relative)

        expect(browser.webExtensionInstall).toHaveBeenCalledWith({
            extensionData: {
                type: 'archivePath',
                path: path.resolve(relative)
            }
        })
    })

    it('maps { base64 } to extension bytes and does not read a path', async () => {
        const browser = await bidiBrowser({ hostname: 'grid.example.com' })
        const readFile = vi.spyOn(fs.promises, 'readFile')

        await browser.installExtension({ base64: 'Ynl0ZXM=' })

        expect(browser.webExtensionInstall).toHaveBeenCalledWith({
            extensionData: {
                type: 'base64',
                value: 'Ynl0ZXM='
            }
        })
        expect(readFile).not.toHaveBeenCalled()
        readFile.mockRestore()
    })

    it('rejects objects other than { base64: string }', async () => {
        const browser = await bidiBrowser()

        // @ts-expect-error wrong payload
        await expect(browser.installExtension({ path: './dist' })).rejects.toThrow(
            'installExtension expects a path string or { base64: string }'
        )
        // @ts-expect-error wrong payload
        await expect(browser.installExtension({ base64: 1 })).rejects.toThrow(
            'installExtension expects a path string or { base64: string }'
        )
        // @ts-expect-error wrong payload
        await expect(browser.installExtension({ base64: 'abc', extra: true })).rejects.toThrow(
            'installExtension expects a path string or { base64: string }'
        )
        // @ts-expect-error wrong payload
        await expect(browser.installExtension(1)).rejects.toThrow(
            'installExtension expects a path string or { base64: string }'
        )
    })

    it('does not read bytes for a local archive', async () => {
        const browser = await bidiBrowser({ hostname: '127.0.0.1' })
        const archive = tempArchive('ext.zip', 'local-zip')
        const readFile = vi.spyOn(fs.promises, 'readFile')

        await browser.installExtension(archive)

        expect(browser.webExtensionInstall).toHaveBeenCalledWith({
            extensionData: {
                type: 'archivePath',
                path: path.resolve(archive)
            }
        })
        expect(readFile).not.toHaveBeenCalled()
        readFile.mockRestore()
    })

    it('sends base64 for a remote archive and not archivePath', async () => {
        const browser = await bidiBrowser({ hostname: 'grid.example.com' })
        const archive = tempArchive('ext.zip', 'remote-zip')

        await browser.installExtension(archive)

        expect(browser.webExtensionInstall).toHaveBeenCalledWith({
            extensionData: {
                type: 'base64',
                value: fs.readFileSync(archive).toString('base64')
            }
        })
    })

    it('treats cloud user and key as remote even on localhost', async () => {
        const browser = await bidiBrowser({
            hostname: 'localhost',
            user: 'cloud-user',
            key: 'short-key'
        })
        const archive = tempArchive('ext.xpi', 'cloud-zip')

        await browser.installExtension(archive)

        expect(browser.webExtensionInstall).toHaveBeenCalledWith({
            extensionData: {
                type: 'base64',
                value: fs.readFileSync(archive).toString('base64')
            }
        })
    })

    it('zips a remote directory in memory and sends base64', async () => {
        const browser = await bidiBrowser({ hostname: 'grid.example.com' })
        const dir = tempDirectory()

        await browser.installExtension(dir)

        const payload = vi.mocked(browser.webExtensionInstall).mock.calls[0][0].extensionData
        expect(payload.type).toBe('base64')
        if (payload.type !== 'base64') {
            return
        }
        const zip = await JSZip.loadAsync(Buffer.from(payload.value, 'base64'))
        expect(await zip.file('manifest.json')?.async('string')).toContain('wdio-extension-fixture')
        expect(await zip.file('nested/note.txt')?.async('string')).toBe('nested')
        expect(zip.file(`${path.basename(dir)}/manifest.json`)).toBeNull()
    })

    it('packs symlinked files and directories for a remote session', async () => {
        const browser = await bidiBrowser({ hostname: 'grid.example.com' })
        const dir = tempDirectory()
        const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-install-extension-link-'))
        created.push(outside)
        fs.mkdirSync(path.join(outside, 'scripts'))
        fs.writeFileSync(path.join(outside, 'scripts', 'main.js'), 'console.log(1)')
        fs.writeFileSync(path.join(outside, 'asset.txt'), 'outside')
        fs.symlinkSync(path.join(outside, 'asset.txt'), path.join(dir, 'asset.txt'))
        fs.symlinkSync(path.join(outside, 'scripts'), path.join(dir, 'scripts'))
        fs.symlinkSync(dir, path.join(dir, 'loop'))

        await browser.installExtension(dir)

        const payload = vi.mocked(browser.webExtensionInstall).mock.calls[0][0].extensionData
        expect(payload.type).toBe('base64')
        if (payload.type !== 'base64') {
            return
        }
        const zip = await JSZip.loadAsync(Buffer.from(payload.value, 'base64'))
        expect(await zip.file('asset.txt')?.async('string')).toBe('outside')
        expect(await zip.file('scripts/main.js')?.async('string')).toBe('console.log(1)')
        expect(zip.file('loop/manifest.json')).toBeNull()
    })

    it('packs a directory and a symlink alias of that directory', async () => {
        const browser = await bidiBrowser({ hostname: 'grid.example.com' })
        const dir = tempDirectory()
        fs.mkdirSync(path.join(dir, 'real'))
        fs.writeFileSync(path.join(dir, 'real', 'main.js'), 'console.log(1)')
        fs.symlinkSync(path.join(dir, 'real'), path.join(dir, 'alias'))

        await browser.installExtension(dir)

        const payload = vi.mocked(browser.webExtensionInstall).mock.calls[0][0].extensionData
        expect(payload.type).toBe('base64')
        if (payload.type !== 'base64') {
            return
        }
        const zip = await JSZip.loadAsync(Buffer.from(payload.value, 'base64'))
        expect(await zip.file('real/main.js')?.async('string')).toBe('console.log(1)')
        expect(await zip.file('alias/main.js')?.async('string')).toBe('console.log(1)')
    })

    it('skips a dangling symlink when zipping a remote directory', async () => {
        const browser = await bidiBrowser({ hostname: 'grid.example.com' })
        const dir = tempDirectory()
        fs.symlinkSync(path.join(dir, 'missing.txt'), path.join(dir, 'dangling.txt'))

        await browser.installExtension(dir)

        const payload = vi.mocked(browser.webExtensionInstall).mock.calls[0][0].extensionData
        expect(payload.type).toBe('base64')
        if (payload.type !== 'base64') {
            return
        }
        const zip = await JSZip.loadAsync(Buffer.from(payload.value, 'base64'))
        expect(await zip.file('manifest.json')?.async('string')).toContain('wdio-extension-fixture')
        expect(zip.file('dangling.txt')).toBeNull()
    })

    it('explains how to enable webExtension.install on Chrome', async () => {
        const browser = await bidiBrowser()
        vi.mocked(browser.webExtensionInstall).mockRejectedValue(new Error(
            'WebDriver Bidi command "webExtension.install" failed with error: unknown error - Method not available.'
        ))

        await expect(browser.installExtension({ base64: 'Ynl0ZXM=' })).rejects.toThrow(
            /Method not available[\s\S]*--enable-unsafe-extension-debugging[\s\S]*--remote-debugging-pipe[\s\S]*webExtension\.install/
        )
    })

    it('throws when webExtension.install does not return an id', async () => {
        const browser = await bidiBrowser()
        vi.mocked(browser.webExtensionInstall).mockResolvedValue({ extension: '' })

        await expect(browser.installExtension({ base64: 'Ynl0ZXM=' })).rejects.toThrow(
            'webExtension.install did not return an extension id'
        )
    })
})
