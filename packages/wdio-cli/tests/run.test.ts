import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
import { launch, cmdArgs } from '../src/commands/run'
import Launcher from '../src/launcher'

vi.mock('../src/launcher', () => ({
    default: vi.fn().mockImplementation((conf, result) => ({
        run: () => Number.isInteger(result) ? Promise.resolve(result) : Promise.reject(result)
    }))
}))

describe('launch', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('should exit with code 0', async () => {
        // @ts-ignore mock feature
        await launch('configFile', 0)
        expect(Launcher).toBeCalledWith('configFile', 0)
        expect(vi.mocked(Launcher).mock.instances).toHaveLength(1)
    })

    it('should exit with code 1', async () => {
        // @ts-ignore mock feature
        await launch('configFile', 1)
        expect(Launcher).toBeCalledWith('configFile', 1)
        expect(vi.mocked(Launcher).mock.instances).toHaveLength(1)
    })

    it('should catch errors', async () => {
        // @ts-ignore mock feature
        await launch('configFile', 'foobar')
        expect(Launcher).toBeCalledWith('configFile', 'foobar')
        expect(vi.mocked(Launcher).mock.instances).toHaveLength(1)
        expect(console.error).toBeCalledWith('foobar')
    })

    afterEach(() => {
        vi.mocked(Launcher).mockClear()
        vi.mocked(console.error).mockRestore()
    })
})

describe('cmdArgs', () => {
    it('should not have default', () => {
        Object.values(cmdArgs).forEach(cmdArg => {
            // @ts-ignore test undefined property
            expect(cmdArg.default).toBeUndefined()
        })
    })
})
