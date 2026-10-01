import path from 'node:path'

import { expect, describe, it, vi } from 'vitest'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/session/context.js', () => ({
    getContextManager () {
        return {
            getCurrentContext: async () => 'frame-context'
        }
    }
}))

const { setFiles } = await import('../../../src/commands/element/setFiles.js')

function element (isBidi = true) {
    const inputSetFiles = vi.fn(async () => ({}))
    const browser = { isBidi, inputSetFiles }
    return {
        inputSetFiles,
        element: {
            elementId: 'shared-id',
            parent: browser
        } as unknown as WebdriverIO.Element
    }
}

describe('setFiles', () => {
    it('forwards the current context, shared id, and normalized paths', async () => {
        const { element: elem, inputSetFiles } = element()
        const absolute = path.resolve('/tmp/a.png')
        const relative = path.resolve('fixtures/b.png')

        await setFiles.call(elem, [absolute, 'fixtures/b.png'])

        expect(inputSetFiles).toHaveBeenCalledWith({
            context: 'frame-context',
            element: { sharedId: 'shared-id' },
            files: [absolute, relative]
        })
    })

    it('uses the browsing context the element was found in', async () => {
        const inputSetFiles = vi.fn(async () => ({}))
        const browser = { isBidi: true, inputSetFiles }
        const frame = { contextId: 'held-frame', browser, parent: browser }
        const elem = { elementId: 'shared-id', parent: frame } as unknown as WebdriverIO.Element
        const absolute = path.resolve('/tmp/file.png')

        await setFiles.call(elem, absolute)

        expect(inputSetFiles).toHaveBeenCalledWith({
            context: 'held-frame',
            element: { sharedId: 'shared-id' },
            files: [absolute]
        })
    })

    it('accepts a single path', async () => {
        const { element: elem, inputSetFiles } = element()
        const absolute = path.resolve('/tmp/file.png')

        await setFiles.call(elem, absolute)

        expect(inputSetFiles).toHaveBeenCalledWith({
            context: 'frame-context',
            element: { sharedId: 'shared-id' },
            files: [absolute]
        })
    })

    it('rejects a classic session and points at setValue', async () => {
        const { element: elem, inputSetFiles } = element(false)

        await expect(setFiles.call(elem, '/tmp/file.png')).rejects.toThrow(
            'setFiles requires a WebDriver BiDi session. On a classic session, use setValue with a path the local browser can already see.'
        )
        expect(inputSetFiles).not.toHaveBeenCalled()
    })

    it('rejects an empty list', async () => {
        const { element: elem, inputSetFiles } = element()

        await expect(setFiles.call(elem, [])).rejects.toThrow('setFiles requires at least one file path.')
        expect(inputSetFiles).not.toHaveBeenCalled()
    })

    it('rejects a non-string path', async () => {
        const { element: elem, inputSetFiles } = element()

        await expect(setFiles.call(elem, 123 as unknown as string)).rejects.toThrow(
            'setFiles expected a file path string, received number.'
        )
        await expect(setFiles.call(elem, ['/tmp/a.png', null] as unknown as string[])).rejects.toThrow(
            'setFiles expected a file path string at index 1, received null.'
        )
        expect(inputSetFiles).not.toHaveBeenCalled()
    })
})
