import { describe, test, expect } from 'vitest'
import { formatMessage } from '../../src/common/utils.js'

describe('formatMessage', () => {
    test('should do nothing if no error or params are given', () => {
        // @ts-ignore params not needed for test scenario
        let params = { type: 'foobar' }
        let message = formatMessage(params as any)
        expect(message).toMatchSnapshot()
    })

    test('should format an error message', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'foobar', err: new Error('uups') }
        const message = formatMessage(params as any)

        // delete stack to avoid differences in stack paths
        // @ts-ignore test scenario
        delete message.error.stack

        expect(message).toMatchSnapshot()
    })

    test('should format an error message with timeout error', () => {
        // @ts-ignore params not needed for test scenario
        const params = {
            type: 'foobar',
            payload: {
                title: 'barfoo',
                parent: { title: 'parentfoo' }
            },
            err: new Error('For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.')
        }
        const message = formatMessage(params as any)

        // delete stack to avoid differences in stack paths
        // @ts-ignore test scenario
        delete message.error.stack

        expect(message).toMatchSnapshot()
    })

    test('should format payload', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: { title: 'parentfoo' },
            context: 'some context',
            ctx: { currentTest: { title: 'current test' } },
            file: '/foo/bar.test.js'
        } }
        const message = formatMessage(params as any)
        expect(message).toMatchSnapshot()
    })

    test('should format parent title', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: { title: '', suites: [{ title: 'first suite' }] }
        } }
        const message = formatMessage(params as any)
        expect(message.parent).toEqual('')
    })

    test('should format fullTitle', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: {
                title: 'Parent 2',
                parent: {
                    title: 'Parent 1'
                }
            }
        } }
        const message = formatMessage(params as any)
        expect(message.fullTitle).toEqual('Parent 1.Parent 2.barfoo')
    })

    test('should format test status', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'afterTest', payload: {
            title: 'barfoo',
            parent: {},
            state: 'failed',
            duration: 123
        } }
        const message = formatMessage(params as any)
        expect(message.passed).toBe(false)
        expect(message.duration).toBe(123)
    })

    test('should format title for mocha beforeAll hook if parent title is present', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'beforeAll', payload: {
            title: '"before all" hook',
            parent: {
                title: 'WebdriverIO'
            },
            state: 'failed',
            duration: 123
        } }
        const message = formatMessage(params as any)
        expect(message.title).toBe('"before all" hook for WebdriverIO')
    })

    test('should not format title for mocha beforeAll hook if parent title is not present', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'beforeAll', payload: {
            title: '"before all" hook',
            parent: {},
            state: 'failed',
            duration: 123
        } }
        const message = formatMessage(params as any)
        expect(message.title).toBe('"before all" hook')
    })

    test('should format title for mocha afterAll hook if parent title is present', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'afterAll', payload: {
            title: '"after all" hook',
            parent: {
                title: 'WebdriverIO'
            },
            state: 'failed',
            duration: 123
        } }
        const message = formatMessage(params as any)
        expect(message.title).toBe('"after all" hook for WebdriverIO')
    })

    test('should not format title for mocha afterAll hook if parent title is not present', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'afterAll', payload: {
            title: '"after all" hook',
            parent: {},
            state: 'failed',
            duration: 123
        } }
        const message = formatMessage(params as any)
        expect(message.title).toBe('"after all" hook')
    })
})
