import { describe, expect, it } from 'vitest'
import { runWithProcessContext } from '../src/processProxy.js'

describe('ProcessProxy', () => {

    it('should allow overrigin global process in context', async() => {
        await runWithProcessContext({
            env: { SOME_ENV_VARIABLE: 'value' }
        }, async () => {
            expect(process.env.SOME_ENV_VARIABLE).toEqual('value')
        })
        expect(process.env.SOME_ENV_VARIABLE).toBeUndefined()
    })

})
