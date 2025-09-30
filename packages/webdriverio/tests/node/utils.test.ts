import path from 'node:path'
import { expect, describe, it } from 'vitest'

import { assertDirectoryExists } from '../../src/node/utils.js'

describe('node utils', () => {
    describe('assertDirectoryExists', () => {
        it('should fail if not existing directory', async () => {
            await expect(() => assertDirectoryExists('/i/dont/exist.png')).rejects.toThrowError(new Error('directory (/i/dont) doesn\'t exist'))
        })
        it('should not fail if directory exists', async () => {
            expect(await assertDirectoryExists('.')).toBe(undefined)
        })
    })
})
