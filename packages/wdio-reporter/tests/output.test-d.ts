import { expectTypeOf, test } from 'vitest'
import type { TestStats } from '../src/index.js'

type Output = TestStats['output'][number]

test('the type of an output entry narrows the entry', () => {
    const narrow = (entry: Output) => {
        if (entry.type === 'userResult') {
            expectTypeOf(entry.result).toEqualTypeOf<{ value: unknown } | { error: unknown }>()
            expectTypeOf(entry.id).toEqualTypeOf<number>()
            expectTypeOf(entry.body).toEqualTypeOf<unknown[]>()
            expectTypeOf(entry.protocol).toEqualTypeOf<'bidi'>()
        } else if (entry.type === 'userCommand') {
            expectTypeOf(entry.command).toEqualTypeOf<string>()
            expectTypeOf(entry.body).toEqualTypeOf<unknown[]>()
            expectTypeOf(entry).not.toHaveProperty('result')
        } else {
            expectTypeOf(entry.type).toEqualTypeOf<'command' | 'result'>()
            expectTypeOf(entry.endpoint).toEqualTypeOf<string>()
            expectTypeOf(entry.result).toEqualTypeOf<{ value: string | null }>()
            expectTypeOf(entry.parent).toEqualTypeOf<number | undefined>()
        }
    }
    expectTypeOf(narrow).toBeFunction()
})
