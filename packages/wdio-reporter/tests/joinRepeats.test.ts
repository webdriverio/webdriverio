import { describe, expect, it } from 'vitest'

import { joinRepeats, joinUserCommandTree, userCommandTree } from '../src/index.js'
import type { UserCommandNode } from '../src/index.js'

const joinStrings = (items: string[]) => joinRepeats(items, (item) => item, (group, count) => `${group.join('')}×${count}`)

describe('joinRepeats', () => {
    it.each([
        [['a', 'a', 'a', 'b'], ['a×3', 'b']],
        [['a', 'b', 'a', 'b', 'a', 'b', 'c'], ['ab×3', 'c']],
        [['a', 'b', 'a', 'b', 'a'], ['ab×2', 'a']],
        [['a', 'a', 'a', 'a'], ['a×4']],
        [['a'], ['a']],
        [['a', 'b'], ['a', 'b']]
    ])('joins %j as %j', (items, expected) => {
        expect(joinStrings(items)).toEqual(expected)
    })

    it('joins no group of more than 4 steps', () => {
        const items = [...'abcde', ...'abcde']
        expect(joinStrings(items)).toEqual(items)
    })

    it('joins 100 identical polls into one step, and stays fast for a long list', () => {
        expect(joinStrings(Array(100).fill('a'))).toEqual(['a×100'])
        const long = Array.from({ length: 10_000 }, (_, i) => String(i % 7))
        const start = Date.now()
        joinStrings(long)
        expect(Date.now() - start).toBeLessThan(200)
    })

    it('gives the dropped copies to join', () => {
        const dropped: string[][] = []
        joinRepeats(['a', 'a', 'a'], (item) => item, (group, count, repeats) => {
            dropped.push(...repeats.map((copy) => [...copy]))
            return `${group[0]}×${count}`
        })
        expect(dropped).toEqual([['a'], ['a']])
    })
})

const user = (id: number, command: string, parent?: number) => ({ type: 'userCommand', id, command, body: [], protocol: 'bidi', ...(parent === undefined ? {} : { parent }) })
const userResult = (id: number, command: string, result: unknown, parent?: number) => ({ ...user(id, command, parent), type: 'userResult', result })
// a waitUntil (id 1) with nested getText calls (ids 2…) and their results
function waitOutput (results: unknown[]) {
    return [
        user(1, 'waitUntil'),
        ...results.flatMap((result, i) => [user(i + 2, 'getText', 1), userResult(i + 2, 'getText', result, 1)]),
        userResult(1, 'waitUntil', { value: true })
    ]
}
const texts = (nodes: UserCommandNode[]): unknown[] => nodes.map((node) => node.children.length ? [node.text, texts(node.children)] : node.text)

describe('userCommandTree and joinUserCommandTree', () => {
    it('builds the tree of nested user commands', () => {
        const tree = userCommandTree(waitOutput([{ value: 'Click' }, { value: 'Done' }]))
        expect(texts(tree)).toEqual([['waitUntil() → true', ['getText() → "Click"', 'getText() → "Done"']]])
    })

    it('joins identical repeated polls, and keeps the poll that differs', () => {
        const results = [...Array(8).fill({ value: 'Click' }), { value: 'Done' }]
        expect(texts(joinUserCommandTree(userCommandTree(waitOutput(results))))).toEqual([
            ['waitUntil() → true', ['getText() → "Click" × 8', 'getText() → "Done"']]
        ])
    })

    it('does not join two results with the same cut text and a different full value', () => {
        const long = (end: string) => ({ value: `${'x'.repeat(100)}${end}` })
        const joined = joinUserCommandTree(userCommandTree(waitOutput([long('a'), long('b')])))
        expect(joined[0].children).toHaveLength(2)
        expect(joined[0].children[0].text).toBe(joined[0].children[1].text)
    })

    it('joins 10 000 nested polls fast', () => {
        const results = Array.from({ length: 10_000 }, (_, i) => ({ value: i % 3 === 0 ? 'a' : 'b' }))
        const start = Date.now()
        const [wait] = joinUserCommandTree(userCommandTree(waitOutput(results)))
        expect(Date.now() - start).toBeLessThan(1000)
        expect(wait.children.length).toBeLessThan(10)
    })

    it('reads no big raw body of a step that cannot be joined, and never joins two steps with a big body', () => {
        let reads = 0
        const big = new Proxy({ data: 'x'.repeat(100_000) }, { get: (target, prop, receiver) => { reads++; return Reflect.get(target, prop, receiver) } })
        const call = (id: number, value: number) => [
            { type: 'command', command: 'upload', body: [big], parent: 1, id },
            { type: 'result', command: 'upload', parent: 1, result: { value } }
        ]
        // different results: these steps cannot be joined
        const unique = [user(1, 'waitUntil'), ...call(1, 1), ...call(2, 2), ...call(3, 3), userResult(1, 'waitUntil', { value: true })]
        joinUserCommandTree(userCommandTree(unique))
        expect(reads).toBe(0)
        // the same result and the same big body: the body is too big to compare, so the steps stay apart
        const same = [user(1, 'waitUntil'), ...call(1, 1), ...call(2, 1), userResult(1, 'waitUntil', { value: true })]
        const [wait] = joinUserCommandTree(userCommandTree(same))
        expect(wait.children).toHaveLength(2)
    })

    it('does not join two calls whose arguments differ after the title limit, or two requests with different bodies', () => {
        const long = (end: string) => `${'x'.repeat(130)}${end}`
        const setValue = (id: number, value: string) => [
            { ...user(id, 'setValue', 1), body: [value] }, { ...userResult(id, 'setValue', { value: null }, 1), body: [value] }
        ]
        const request = (body: object) => [
            { type: 'command', command: 'executeScript', method: 'POST', endpoint: '/session/:sessionId/execute/sync', body, parent: 1 },
            { type: 'result', command: 'executeScript', method: 'POST', endpoint: '/session/:sessionId/execute/sync', parent: 1, result: { value: 1 } }
        ]
        const output = [user(1, 'waitUntil'), ...setValue(2, long('A')), ...setValue(3, long('B')), ...request({ script: 'a' }), ...request({ script: 'b' }), userResult(1, 'waitUntil', { value: true })]
        const [wait] = joinUserCommandTree(userCommandTree(output))
        expect(wait.children).toHaveLength(4)
        expect(wait.children.some((node) => node.repeat)).toBe(false)
    })

    it('joins two identical parents with their children, and never mixes the children of different parents', () => {
        const output = [
            user(1, 'waitUntil'), user(2, 'getText', 1), userResult(2, 'getText', { value: 'a' }, 1), userResult(1, 'waitUntil', { value: true }),
            user(3, 'waitUntil'), user(4, 'getText', 3), userResult(4, 'getText', { value: 'a' }, 3), userResult(3, 'waitUntil', { value: true })
        ]
        expect(texts(joinUserCommandTree(userCommandTree(output)))).toEqual([
            ['waitUntil() → true × 2', ['getText() → "a"']]
        ])
    })

    it('joins identical failed polls as one failed step', () => {
        const failed = { error: { name: 'Error', message: 'not found' } }
        const joined = joinUserCommandTree(userCommandTree(waitOutput([failed, failed, failed])))
        expect(joined[0].children).toHaveLength(1)
        expect(joined[0].children[0]).toMatchObject({ text: 'getText() × 3', repeat: 3, result: { result: failed } })
    })

    it('joins a repeated group of steps as one × N step with one copy of the group', () => {
        const output = [user(1, 'waitUntil')]
        for (let i = 0; i < 3; i++) {
            output.push(user(10 + i * 2, '$', 1), userResult(10 + i * 2, '$', { value: 'x' }, 1) as never)
            output.push(user(11 + i * 2, 'getText', 1), userResult(11 + i * 2, 'getText', { value: 'Click' }, 1) as never)
        }
        output.push(userResult(1, 'waitUntil', { value: true }) as never)
        const [wait] = joinUserCommandTree(userCommandTree(output))
        expect(wait.children).toHaveLength(1)
        expect(wait.children[0]).toMatchObject({ text: '× 3', repeat: 3 })
        expect(texts(wait.children[0].children)).toEqual(['$() → "x"', 'getText() → "Click"'])
    })
})
