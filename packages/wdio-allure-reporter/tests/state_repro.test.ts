import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AllureReportState } from '../src/state.js'

describe('AllureReportState - Nested Suite Scope Management', () => {
    let state: AllureReportState
    let runtimeMock: any

    beforeEach(() => {
        runtimeMock = {
            startScope: vi.fn().mockImplementation(() => `scope-${Math.random()}`),
            writeScope: vi.fn(),
            startTest: vi.fn().mockReturnValue('test-uuid'),
            writeTest: vi.fn(),
            updateTest: vi.fn(),
            stopTest: vi.fn(),
            applyRuntimeMessages: vi.fn()
        }
        state = new AllureReportState(runtimeMock)
    })

    it('should maintain correct scope stack with peer suites', async () => {
        // Sequence: Suite A -> Suite B -> Test 1 -> End Test -> End B -> Suite C -> Test 2
        let scopeCounter = 0
        runtimeMock.startScope.mockImplementation(() => `scope-${++scopeCounter}`)

        const messages = [
            { type: 'allure:suite:start', data: { name: 'Suite A' } },
            { type: 'allure:suite:start', data: { name: 'Suite B' } },
            { type: 'allure:test:start', data: { name: 'Test 1', start: Date.now() } },
            { type: 'allure:test:end', data: { status: 'passed', stop: Date.now() } },
            { type: 'allure:suite:end', data: {} },
            { type: 'allure:suite:start', data: { name: 'Suite C' } },
            { type: 'allure:test:start', data: { name: 'Test 2', start: Date.now() } }
        ]

        messages.forEach(m => state.pushRuntimeMessage(m as any))
        await state.processRuntimeMessage()

        const startTestCalls = runtimeMock.startTest.mock.calls
        expect(startTestCalls.length).toBe(2)

        const test2Scopes = startTestCalls[1][1]

        // Test 2 should be in [A, C, T2-scope], NOT [A, B, C, T2-scope]
        expect(test2Scopes).toHaveLength(3)
        expect(test2Scopes[0]).toBe('scope-1') // Suite A
        expect(test2Scopes[1]).toBe('scope-4') // Suite C (not scope-2 which is Suite B)
        expect(test2Scopes).not.toContain('scope-2') // Suite B should NOT be in Test 2's scopes
    })
})
