import { loadModule } from '../src/utils'

test('loadModule with existing package', () => {
    loadModule('randomModule', { foo: 'bar' })
    expect(global.foo).toBe('bar')
})

test('loadModule with non existing package', () => {
    expect(() => loadModule('nonExistingModule', { foo: 'bar' }))
        .toThrow('Module nonExistingModule can\'t get loaded')
})

afterAll(() => {
    delete global.foo
})
