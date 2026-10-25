import { describe, expect, it } from 'vitest'
import type { SuiteStats } from '@wdio/reporter'

import JsonGenerator from '../src/jsonGenerator.js'

describe('JsonGenerator.removeOutput', () => {
    it('clears the output of the tests and of the hooks, also in nested suites', () => {
        const output = () => [{ type: 'result', body: { value: 'iVBORw0KGgo' } }]
        const inner = { tests: [{ output: output() }], hooks: [{ output: output() }, {}], suites: [] }
        const suites = [{ tests: [{ output: output() }], hooks: [{ output: output() }], suites: [inner] }] as unknown as SuiteStats[]

        JsonGenerator.removeOutput(suites)

        expect(suites[0].tests[0].output).toEqual([])
        expect(suites[0].hooks[0].output).toEqual([])
        expect(inner.tests[0].output).toEqual([])
        expect(inner.hooks[0].output).toEqual([])
        // a hook with no command keeps no output field
        expect('output' in inner.hooks[1]).toBe(false)
    })
})
