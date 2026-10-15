import path from 'node:path'

import { describe, it, expect, vi } from 'vitest'
import { remote } from '../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('element protocol command hooks', () => {
    it('fires as many afterCommand as beforeCommand hooks for one command', async () => {
        const beforeCommand = vi.fn()
        const afterCommand = vi.fn()
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar' },
            beforeCommand: [beforeCommand],
            afterCommand: [afterCommand]
        })
        const elem = await browser.$('.foo')
        beforeCommand.mockClear()
        afterCommand.mockClear()

        await elem.elementClick(elem.elementId)

        expect(beforeCommand).toHaveBeenCalled()
        expect(afterCommand.mock.calls.length).toBe(beforeCommand.mock.calls.length)
    })
})
