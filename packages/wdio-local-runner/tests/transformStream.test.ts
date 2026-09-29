import { Readable } from 'node:stream'
import { test, expect } from 'vitest'

import runnerTransformStream from '../src/transformStream.js'

function read(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []

        stream.on('data',   chunk => chunks.push(Buffer.from(chunk)))
        stream.on('error',  err => reject(err))
        stream.on('unpipe', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

test('should add cid to message', async () => {
    const input = Readable.from(['foobar'])
    const output = await read(runnerTransformStream('0-5', input))
    expect(output).toEqual('[0-5] foobar\n')
})

test('should add cid at the beginning of each line for multi-line message', async () => {
    const input = Readable.from(['line 1\nline ', '2\nline 3\n'])
    const output = await read(runnerTransformStream('0-5', input))
    expect(output).toEqual('[0-5] line 1\n[0-5] line 2\n[0-5] line 3\n')
})

test('should ignore debugger messages', async () => {
    const input = Readable.from([
        'Debugger listening on ws://127.0.0.1:9229/abc\n',
        'Debugger attached\n',
        'Waiting for the debugger to disconnect...\n',
        'suite started\n',
    ])
    const output = await read(runnerTransformStream('0-5', input))
    expect(output).toEqual('[0-5] suite started\n')
})
