import { expectTypeOf, test } from 'vitest'
import type { TestStats, UserCommandOutput, UserResultOutput } from '../src/index.js'
import { isUserCommandOutput, isUserResultOutput } from '../src/index.js'

type Output = TestStats['output'][number]

test('the guards narrow an entry to a user entry', () => {
    const narrow = (entry: Output) => {
        if (isUserResultOutput(entry)) {
            expectTypeOf(entry).toExtend<UserResultOutput>()
            expectTypeOf(entry.result).toExtend<{ value: unknown } | { error: unknown }>()
            expectTypeOf(entry.id).toEqualTypeOf<number>()
            expectTypeOf(entry.protocol).toEqualTypeOf<'bidi'>()
        } else if (isUserCommandOutput(entry)) {
            expectTypeOf(entry).toExtend<UserCommandOutput>()
            expectTypeOf(entry.command).toEqualTypeOf<string>()
            expectTypeOf(entry.id).toEqualTypeOf<number>()
        } else {
            expectTypeOf(entry.endpoint).toEqualTypeOf<string>()
            expectTypeOf(entry.result).toEqualTypeOf<{ value: string | null }>()
            expectTypeOf(entry.parent).toEqualTypeOf<number | undefined>()
        }
    }
    expectTypeOf(narrow).toBeFunction()
})

test('the type of an entry has the user types', () => {
    expectTypeOf<Output['type']>().toEqualTypeOf<'command' | 'result' | 'userCommand' | 'userResult'>()
})
