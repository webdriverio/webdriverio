import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
import { launch, cmdArgs } from '../src/commands/run.js'
import Launcher from '../src/launcher.js'

vi.mock('../src/launcher', () => ({
    default: vi.fn().mockImplementation(function (conf, result) {
        return {
            run: vi.fn(() => Number.isInteger(result) ? Promise.resolve(result) : Promise.reject(result))
        }
    })
}))

describe('launch', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => { })
    })

    it('forwards the config path and params to the launcher and runs it', async () => {
        // @ts-ignore mock feature
        await launch('configFile', 0)
        expect(Launcher).toBeCalledWith('configFile', 0)
        const launched = vi.mocked(Launcher).mock.results[0].value as { run: ReturnType<typeof vi.fn> }
        expect(launched.run).toHaveBeenCalledTimes(1)
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
    it('should have cpuProf and heapProf args without defaults', () => {
        expect(cmdArgs.cpuProf).toBeDefined()
        expect(cmdArgs.heapProf).toBeDefined()
    })
})
