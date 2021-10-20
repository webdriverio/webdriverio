import RequireLibrary from '../src/lib/RequireLibrary'
import path from 'path'
jest.mock('ts-node', () => 'mock module')

describe('RequireLibrary', () => {
    describe('require', function () {

        it('should try to require when module exists', function () {
            const svc = new RequireLibrary()
            expect(svc.require('ts-node')).toEqual('mock module')
        })

        it('should what to require', function () {
            const svc = new RequireLibrary()
            expect(() => svc.require('abcdef xyz')).toThrowError("Cannot find module 'abcdef xyz' from 'packages/wdio-config/src/lib/RequireLibrary.ts'")
        })
    })

    describe('resolve', function () {

        it('should try to resolve', function () {
            const svc = new RequireLibrary()
            expect(svc.resolve('ts-node', {})).toEqual(path.resolve(__dirname, '../../../node_modules/ts-node/dist/index.js'))
        })

        it('should try to resolve', function () {
            const svc = new RequireLibrary()
            expect(() => svc.resolve('abcdef xyz', {})).toThrowError("Cannot find module 'abcdef xyz' from 'packages/wdio-config/src/lib/RequireLibrary.ts'")
        })

    })

})
