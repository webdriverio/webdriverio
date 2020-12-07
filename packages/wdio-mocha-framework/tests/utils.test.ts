import { loadModule } from '../src/utils'

declare global {
    module NodeJS {
        interface Global {
            foo: string
        }
    }
}

test('loadModule with existing package', () => {
    loadModule('randomModule', { foo: 'bar' } as any)
    expect(global.foo).toBe('bar')
})

test('loadModule with non existing package', () => {
    expect(() => loadModule('nonExistingModule', { foo: 'bar' } as any))
        .toThrow('Module nonExistingModule can\'t get loaded')
})

afterAll(() => {
    delete global.foo
})
