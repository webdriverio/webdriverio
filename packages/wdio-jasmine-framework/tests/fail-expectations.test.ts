import path from 'node:path'
import { expect, test, vi } from 'vitest'

import { JasmineAdapter } from '../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const runJasmineSpec = async (
    fixtureName: string,
    extraConfig: Record<string, unknown> = {}
) => {
    const events: [string, Record<string, any>][] = []
    const afterTestCalls: unknown[][] = []
    const reporter = {
        emit: vi.fn((event: string, payload: Record<string, any>) => {
            events.push([event, payload])
        }),
        on: vi.fn(),
        write: vi.fn()
    }
    const spec = path.join(__dirname, '__fixtures__', fixtureName)
    const adapter = new JasmineAdapter(
        '0-0',
        {
            beforeHook: [],
            afterHook: [],
            beforeTest: [],
            afterTest: [(...args: unknown[]) => {
                afterTestCalls.push(args)
            }],
            after: [],
            ...extraConfig
        } as any,
        [spec],
        { browserName: 'chrome' } as any,
        reporter as any
    )

    await adapter.init()
    const failedCount = await adapter.run()
    return { failedCount, events, afterTestCalls }
}

test('fail() calls are not duplicated by testFnWrapper rethrowing framework failures', async () => {
    const { failedCount, events, afterTestCalls } = await runJasmineSpec('multipleFail.js')

    expect(failedCount).toBe(3)

    const testFails = events
        .filter(([event]) => event === 'test:fail')
        .map(([, payload]) => payload)
    expect(testFails).toHaveLength(3)

    const threeFails = testFails.find((p) => p.title === 'records three fail() calls without duplicating the first')
    expect(threeFails).toBeDefined()
    expect(threeFails!.errors).toHaveLength(3)
    expect(threeFails!.errors.map((e: { message: string }) => e.message)).toEqual([
        'Failed: first',
        'Failed: second',
        'Failed: third'
    ])
    for (const err of threeFails!.errors) {
        expect(err.message).not.toContain('error properties:')
        expect(err.stack ?? '').not.toContain('recordExpectation')
    }

    const singleErrorFail = testFails.find((p) => p.title === 'records a single fail(Error) once')
    expect(singleErrorFail).toBeDefined()
    expect(singleErrorFail!.errors).toHaveLength(1)
    expect(singleErrorFail!.errors[0].message).toContain('explicit error')

    const failThenThrow = testFails.find((p) => p.title === 'keeps both fail() and a subsequent thrown error')
    expect(failThenThrow).toBeDefined()
    expect(failThenThrow!.errors).toHaveLength(2)
    expect(failThenThrow!.errors[0].message).toBe('Failed: before throw')
    expect(failThenThrow!.errors[1].message).toContain('uncaught boom')

    // afterTest still receives the first failure and passed: false
    const firstAfterTest = afterTestCalls.find(
        ([testInfo]) => (testInfo as { description?: string })?.description === 'records three fail() calls without duplicating the first'
    )
    expect(firstAfterTest).toBeDefined()
    const firstAfterResult = firstAfterTest![2] as { passed: boolean, error?: { message?: string } }
    expect(firstAfterResult.passed).toBe(false)
    expect(firstAfterResult.error?.message).toBe('Failed: first')
})

test('a throwing expectationResultHandler failure is recorded once', async () => {
    const { failedCount, events } = await runJasmineSpec('passingAfterAll.js', {
        jasmineOpts: {
            expectationResultHandler: () => {
                throw new Error('custom handler rejected pass')
            }
        }
    })

    expect(failedCount).toBe(1)
    const testFails = events
        .filter(([event]) => event === 'test:fail')
        .map(([, payload]) => payload)
    expect(testFails).toHaveLength(1)
    expect(testFails[0].errors).toHaveLength(1)
    expect(testFails[0].errors[0].message).toContain('expectationResultHandlerError: custom handler rejected pass')
})
