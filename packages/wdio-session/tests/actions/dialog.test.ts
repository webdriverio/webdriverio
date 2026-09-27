import { describe, expect, it } from 'vitest'

import { dialog } from '../../src/actions/contexts.js'
import { renderResult } from '../../src/cli/output.js'
import { ACTION_MAP, actionIsMutation } from '../../src/actions/specs.js'
import type { Session } from '../../src/session.js'

function harness (alert?: string) {
    const store = new Map<string, unknown>()
    const calls: string[] = []
    const session = {
        applies: ['W'],
        get: (key: string) => store.get(key),
        set: (key: string, value: unknown) => {
            store.set(key, value)
        },
        browser: {
            getAlertText: async () => {
                if (alert === undefined) {
                    throw new Error('no such alert')
                }
                return alert
            },
            acceptAlert: async () => {
                calls.push('accept')
            },
            dismissAlert: async () => {
                calls.push('dismiss')
            }
        }
    } as unknown as Session
    return { session, store, calls }
}

describe('dialog status', () => {
    it('reports that nothing is open', async () => {
        const { session, calls } = harness()
        const result = await dialog(session, { sub: 'status', $cwd: '/' })
        expect(result.text).toBe('No dialog open')
        expect(result.data).toEqual({ open: false })
        expect(result.history).toBeUndefined()
        expect(calls).toEqual([])
        expect(actionIsMutation(ACTION_MAP.get('dialog')!, { sub: 'status' })).toBe(false)
        expect(actionIsMutation(ACTION_MAP.get('dialog')!, { sub: 'accept' })).toBe(true)
        const quiet = renderResult(result, { quiet: true, mutation: false, session: 'default', action: 'dialog' })
        expect(quiet).toContain('No dialog open')
    })

    it('reports a dialog the session already captured', async () => {
        const { session, store, calls } = harness()
        store.set('dialog', {
            type: 'confirm',
            message: 'Leave?',
            accept: async () => calls.push('accept'),
            dismiss: async () => calls.push('dismiss')
        })
        const result = await dialog(session, { sub: 'status', $cwd: '/' })
        expect(result.text).toBe('confirm: "Leave?"')
        expect(result.data).toEqual({ open: true, type: 'confirm', message: 'Leave?' })
        expect(calls).toEqual([])
    })

    it('reports alert text when the driver still has one open', async () => {
        const { session } = harness('Overwrite the file?')
        const result = await dialog(session, { sub: 'status', $cwd: '/' })
        expect(result.text).toBe('alert: "Overwrite the file?"')
        expect(result.data).toEqual({ open: true, type: 'alert', message: 'Overwrite the file?' })
    })
})

describe('dialog accept', () => {
    it('accepts a captured dialog and clears it', async () => {
        const { session, store, calls } = harness()
        store.set('dialog', {
            type: 'alert',
            message: 'Saved',
            accept: async () => {
                calls.push('accept')
            },
            dismiss: async () => {
                calls.push('dismiss')
            }
        })
        const result = await dialog(session, { sub: 'accept', $cwd: '/' })
        expect(result.text).toBe('Accepted alert "Saved"')
        expect(store.get('dialog')).toBeUndefined()
        expect(calls).toEqual(['accept'])
    })
})
