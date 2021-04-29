import { Readable, Stream } from 'stream'
import runnerTransformStream from '../src/transformStream'
import { DEBUGGER_MESSAGES } from '../src/constants'

const expect = global.expect as unknown as jest.Expect

function transform(inputChunks: string[], fn: (input: Stream) => Stream | undefined): Promise<string> {
    const chunks: Buffer[] = []
    const output = fn(Readable.from(inputChunks))

    return new Promise((resolve, reject) => {
        output?.on('data', chunk => chunks.push(Buffer.from(chunk)))
        output?.on('error', (err) => reject(err))
        output?.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

test('should add cid to message', async () => {

    const output = await transform(['foobar'], stream => runnerTransformStream(stream, '0-5'))

    expect(output).toEqual('[0-5] foobar\n')
})

test('should add cid at the beginning of each line for multi-line message', async () => {

    const output = await transform(['line 1\nline ', '2\nline 3\n'], stream => runnerTransformStream(stream, '0-5'))

    expect(output).toEqual('[0-5] line 1\n[0-5] line 2\n[0-5] line 3\n')
})

test('should ignore debugger messages', async () => {

    const inputChunks = DEBUGGER_MESSAGES.map(m => `${m} foobar`)

    const output = await transform(inputChunks, stream => runnerTransformStream(stream, '0-5'))

    expect(output).toEqual('')
})
