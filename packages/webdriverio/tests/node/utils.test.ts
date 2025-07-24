import path from 'node:path'
import { expect, describe, it } from 'vitest'

import { getAbsoluteFilepath, assertDirectoryExists } from '../../src/node/utils.js'

describe('node utils', () => {
    describe('getAbsoluteFilepath', () => {
        it('should not change filepath if starts with forward slash', () => {
            const filepath = '/packages/bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(filepath)
        })

        it('should not change filepath if starts with backslash slash', () => {
            const filepath = '\\packages\\bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(filepath)
        })

        it('should not change filepath if starts with windows drive letter', async () => {
            const filepath = 'E:\\foo\\bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(filepath)
        })

        it('should change filepath if does not start with forward or back slash', async () => {
            const filepath = 'packages/bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(path.join(process.cwd(), 'packages/bar.png'))
        })
    })

    describe('assertDirectoryExists', () => {
        it('should fail if not existing directory', async () => {
            await expect(() => assertDirectoryExists('/i/dont/exist.png')).rejects.toThrowError(new Error('directory (/i/dont) doesn\'t exist'))
        })
        it('should not fail if directory exists', async () => {
            expect(await assertDirectoryExists('.')).toBe(undefined)
        })
    })
})
