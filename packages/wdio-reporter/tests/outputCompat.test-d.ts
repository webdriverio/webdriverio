import { expectTypeOf, test } from 'vitest'
import type { TestStats } from '../src/index.js'

// reporter code that compiles against the output type of the release before user entries
test('output entries read as before', () => {
    const narrowOnType = (test: Pick<TestStats, 'output'>) => {
        const out: string[] = []
        test.output.forEach((data) => {
            switch (data.type) {
            case 'command':
                out.push(data.method ? `${data.method.toUpperCase()} ${data.endpoint.replace(':sessionId', data.sessionId)} ${JSON.stringify(data.body)}` : `${data.command} ${JSON.stringify(data.params)}`)
                break
            case 'result':
                out.push(JSON.stringify(data.body))
                break
            }
        })
        return out
    }
    const checkWithIf = (test: TestStats) => {
        for (const o of test.output) {
            if (o.type === 'command') { void o.endpoint; void o.method }
            if (o.type === 'result') { void o.result.value }
        }
    }
    const readDirectly = (test: TestStats) => {
        const first = test.output[0]
        return [first.body, first.result, first.method, first.endpoint, first.command, first.params, first.sessionId, first.cid]
    }
    const filterThenRead = (test: TestStats) => test.output.filter((o) => o.type === 'command').map((o) => o.endpoint)
    const pushLiteral = (test: TestStats) => {
        test.output.push({
            type: 'command', command: 'x', params: [], method: 'GET', endpoint: '/x', body: {},
            result: { value: null }, sessionId: 's', cid: '0-0'
        })
    }
    const assign = (test: TestStats) => {
        test.output = test.output.slice(1)
    }
    expectTypeOf(narrowOnType).toBeFunction()
    expectTypeOf(checkWithIf).toBeFunction()
    expectTypeOf(readDirectly).toBeFunction()
    expectTypeOf(filterThenRead).toBeFunction()
    expectTypeOf(pushLiteral).toBeFunction()
    expectTypeOf(assign).toBeFunction()
})
