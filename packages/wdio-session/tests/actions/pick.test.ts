import { describe, expect, it, vi } from 'vitest'

import { RefRegistry } from '@wdio/snapshot'
import type { SnapshotNode } from '@wdio/snapshot'
import { pick, DECIDER_KEY } from '../../src/actions/pick.js'
import { cmdWith } from '../../src/hints.js'
import type { Decider, DecisionQuestion } from '../../src/decider.js'
import type { Session } from '../../src/session.js'

const refs = [
    { id: 'e1', role: 'button', name: 'Add to cart', candidates: [{ kind: 'aria', selector: 'aria/Add to cart' }] },
    { id: 'e2', role: 'button', name: 'Add to cart', candidates: [{ kind: 'aria', selector: 'aria/Add to cart' }] },
    { id: 'e3', role: 'textbox', name: 'Email', candidates: [{ kind: 'aria', selector: 'aria/Email' }] }
]
const tree: SnapshotNode = {
    role: 'document',
    name: 'Shop',
    children: [
        { role: 'listitem', children: [{ role: 'text', name: 'Blue Shirt' }, { role: 'button', name: 'Add to cart', ref: 'e1' }] },
        { role: 'listitem', children: [{ role: 'text', name: 'Red Shirt' }, { role: 'button', name: 'Add to cart', ref: 'e2' }] },
        { role: 'textbox', name: 'Email', ref: 'e3' }
    ]
}

function pickSession (decider: Decider) {
    const store = new Map<string, unknown>([[DECIDER_KEY, decider]])
    return {
        isWeb: true,
        applies: ['W'],
        cmd: cmdWith(),
        currentUrl: async () => 'https://shop.test/',
        refs: new RefRegistry(),
        get: (key: string) => store.get(key),
        browser: {
            execute: async () => ({ tree: structuredClone(tree), refs, counter: 4 })
        }
    } as unknown as Session
}

function deciding (probabilities?: Record<string, number>, choice = 'B') {
    const decide = vi.fn(async (_question: DecisionQuestion) => ({ choice, ...(probabilities ? { probabilities } : {}) }))
    return { decider: { name: 'qwen', decide } as Decider, decide }
}

describe('pick', () => {
    it('asks about the elements with the text around them and prints the pick', async () => {
        const { decider, decide } = deciding({ A: 0.05, B: 0.9, C: 0.05 })
        const result = await pick(pickSession(decider), { intent: 'add the red shirt to the cart', $cwd: '/' })
        const question = decide.mock.calls[0][0]
        expect(question.context).toBe('Page: https://shop.test/')
        expect(question.instructions).toContain('"add the red shirt to the cart"')
        expect(Object.keys(question.options)).toEqual(['A', 'B', 'C'])
        expect(question.options.B).toContain('Red Shirt')
        expect(result.text).toContain('Picked e2 for "add the red shirt to the cart" (90%, next 5%, qwen):')
        expect(result.text).toContain('`wdio session click e2` acts on it.')
        expect(result.data).toMatchObject({ picked: 'e2', asked: 3, total: 3, model: 'qwen' })
        expect((result.data as { candidates: { ref: string }[] }).candidates.map((c) => c.ref)).toEqual(['e2', 'e1', 'e3'])
    })

    it('only asks about elements the action applies to', async () => {
        const { decider, decide } = deciding({ A: 1 }, 'A')
        const result = await pick(pickSession(decider), { intent: 'newsletter email', action: 'fill', top: 1, $cwd: '/' })
        expect(Object.values(decide.mock.calls[0][0].options)).toEqual(['textbox "Email"'])
        expect(result.text).toContain('Asked about the 1 element `fill` applies to.')
        expect(result.text).toContain('`wdio session fill e3 <text>` acts on it.')
    })

    it('fails with the candidates when the pick is not clear', async () => {
        const { decider } = deciding({ A: 0.45, B: 0.4, C: 0.15 }, 'A')
        const error = await pick(pickSession(decider), { intent: 'add a shirt', $cwd: '/' }).catch((err) => err)
        expect(error.code).toBe('NO_MATCH')
        expect(error.message).toContain('the best match has 45%, below 60%')
        expect(error.message).toContain('e2')

        const closer = deciding({ A: 0.6, B: 0.42, C: 0 }, 'A')
        await expect(pick(pickSession(closer.decider), { intent: 'add a shirt', $cwd: '/' })).rejects.toThrow('the best two are 18% apart, closer than 20%')
    })

    it('does not trust a choice without probabilities', async () => {
        const { decider } = deciding(undefined, 'C')
        await expect(pick(pickSession(decider), { intent: 'email', $cwd: '/' })).rejects.toThrow('qwen returned no token probabilities, so its choice e3 is unscored')
    })

    it('honors the thresholds it is given', async () => {
        const { decider } = deciding({ A: 0.45, B: 0.4, C: 0.15 }, 'A')
        const result = await pick(pickSession(decider), { intent: 'add a shirt', minConfidence: 0.4, minMargin: 0, $cwd: '/' })
        expect(result.data).toMatchObject({ picked: 'e1' })
    })
})
