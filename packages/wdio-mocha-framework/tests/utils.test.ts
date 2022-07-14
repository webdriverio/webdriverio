import path from 'node:path'
import { test, expect, vi, afterAll } from 'vitest'
import { loadModule } from '../src/utils'

declare global {
    var foo: string | undefined
}

vi.mock('randomModule', () => import(path.join(process.cwd(), '__mocks__', 'randomModule')))

test('loadModule with existing package', async () => {
    await loadModule('randomModule')
    expect(global.foo).toBe('bar')
})

test('loadModule with non existing package', async () => {
    await expect(() => loadModule('nonExistingModule'))
        .rejects.toThrow('Module nonExistingModule can\'t get loaded')
})

afterAll(() => {
    delete global.foo
})
