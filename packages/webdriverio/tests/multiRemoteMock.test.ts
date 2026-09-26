import { describe, expect, it, vi } from 'vitest'

import { MultiRemoteMock } from '../src/multiRemoteMock.js'

type FakeMock = WebdriverIO.Mock & {
    [key: string]: ReturnType<typeof vi.fn>
}

const CHAINABLE = [
    'abort',
    'abortOnce',
    'clear',
    'reset',
    'redirect',
    'redirectOnce',
    'request',
    'requestOnce',
    'respond',
    'respondOnce',
    'on'
] as const

function fakeMock(calls: { id: string }[] = []): FakeMock {
    const mock = {
        calls
    } as FakeMock

    for (const method of CHAINABLE) {
        mock[method] = vi.fn(() => mock)
    }
    mock.restore = vi.fn(async () => mock)
    mock.waitForResponse = vi.fn(async () => true)
    mock.getBinaryResponse = vi.fn(() => null)
    return mock
}

function create() {
    const chrome = fakeMock([{ id: 'chrome' }])
    const firefox = fakeMock([{ id: 'firefox' }])
    const multi = new MultiRemoteMock(['chrome', 'firefox'], [chrome, firefox])
    return { chrome, firefox, multi }
}

describe('MultiRemoteMock', () => {
    it('names each mock and throws for an unknown instance', () => {
        const { chrome, firefox, multi } = create()

        expect(multi.isMultiRemote).toBe(true)
        expect(multi.instances).toEqual(['chrome', 'firefox'])
        expect(multi.getInstance('chrome')).toBe(chrome)
        expect(multi.getInstance('firefox')).toBe(firefox)
        expect(multi.getInstance('chrome').calls).toEqual([{ id: 'chrome' }])
        expect(() => multi.getInstance('safari')).toThrow(
            'Multi-remote object has no instance named "safari"'
        )
    })

    it('rejects a result list that does not match the instances', () => {
        expect(() => new MultiRemoteMock(['chrome'], [])).toThrow(
            'Cannot build a multiremote mock: instance names (1) and mocks (0) differ'
        )
    })

    it.each(CHAINABLE)('%s runs on every instance and returns the multiremote mock', (method) => {
        const { chrome, firefox, multi } = create()
        const args = method === 'on' ? ['request', () => undefined] : ['payload', { statusCode: 201 }]

        expect(multi[method](...args as [string])).toBe(multi)
        expect(chrome[method]).toHaveBeenCalledTimes(1)
        expect(chrome[method]).toHaveBeenCalledWith(...args)
        expect(firefox[method]).toHaveBeenCalledTimes(1)
        expect(firefox[method]).toHaveBeenCalledWith(...args)
    })

    it('restores every instance and resolves to the multiremote mock', async () => {
        const { chrome, firefox, multi } = create()

        await expect(multi.restore()).resolves.toBe(multi)
        expect(chrome.restore).toHaveBeenCalledTimes(1)
        expect(firefox.restore).toHaveBeenCalledTimes(1)
    })

    it('waits for a response on every instance', async () => {
        const { chrome, firefox, multi } = create()
        firefox.waitForResponse.mockResolvedValueOnce(false)

        await expect(multi.waitForResponse({ timeout: 50 })).resolves.toEqual([true, false])
        expect(chrome.waitForResponse).toHaveBeenCalledWith({ timeout: 50 })
        expect(firefox.waitForResponse).toHaveBeenCalledWith({ timeout: 50 })
    })

    it('propagates a waitForResponse failure from any instance', async () => {
        const { firefox, multi } = create()
        firefox.waitForResponse.mockRejectedValueOnce(new Error('timed out'))

        await expect(multi.waitForResponse()).rejects.toThrow('timed out')
    })

    it('returns binary responses in instance order', () => {
        const { chrome, firefox, multi } = create()
        const body = Buffer.from('chrome')
        chrome.getBinaryResponse.mockReturnValueOnce(body)

        expect(multi.getBinaryResponse('req-1')).toEqual([body, null])
        expect(chrome.getBinaryResponse).toHaveBeenCalledWith('req-1')
        expect(firefox.getBinaryResponse).toHaveBeenCalledWith('req-1')
    })
})
