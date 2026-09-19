import { expectTypeOf, test } from 'vitest'

import { mock } from '../src/index.js'

test('passes the original module namespace to mock factories', () => {
    mock('./example.js', (originalModule) => {
        expectTypeOf(originalModule).toEqualTypeOf<Readonly<Record<string, unknown>>>()

        // @ts-expect-error module namespace exports are read-only
        originalModule.default = 'mutated value'

        return {
            ...originalModule,
            default: 'mocked value'
        }
    })
})
