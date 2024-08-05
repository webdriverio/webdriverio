import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { run } from '../src/runLite.js'

// @ts-ignore mock exports instances, package doesn't
import { instances } from '@wdio/runner'
vi.mock('@wdio/runner', () => import(path.join(process.cwd(), '__mocks__', '@wdio/runner')))

describe('runLite', () => {

    it('should return a process shim that initializes', async() => {
        const childProcess = run({})
        let resolved: any
        const finishPromise = new Promise(res => resolved = res)
        childProcess.on('message', (data) => {
            expect(data).toEqual({ name: 'ready', origin: 'worker' })
            resolved()
        })

        await finishPromise
    })

    it('should call runner command on process message', async () => {
        const childProcess = run({})
        const data: any[] = []
        const listener = (...args: any) => {data.push(args)}
        await new Promise((resolve) => setTimeout(resolve, 10))
        childProcess.send({ command: 'run' })
        childProcess.on('message', listener)
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(instances.pop().run).toHaveBeenCalledTimes(1)
        expect(data[data.length-1][0]).toEqual({
            origin: 'worker',
            name: 'finishedCommand',
            content: { command: 'run', result: { foo: 'bar' } }
        })
    })

    it('should not fail on non existent commands', async () => {
        const childProcess = run({})
        await new Promise((resolve) => setTimeout(resolve, 10))
        childProcess.send({ command: 'doesnt exist' })
    })

    it('should raise errors', async () => {
        const childProcess = run({})
        const data: any[] = []
        const listener = (...args: any) => {data.push(args)}
        await new Promise((resolve) => setTimeout(resolve, 10))
        childProcess.on('message', listener)
        const mock = instances.pop()
        const errorRegister = vi.mocked(mock.on).mock.calls.find((item:any) => item[0] === 'error')
        errorRegister![1]({})
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(data[0][0].name).toEqual('error')
    })

})
