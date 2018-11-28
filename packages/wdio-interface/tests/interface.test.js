import WDIOInterface from '../src'

process.env.WDIO_TEST = 1

let iface

beforeEach(() => {
    iface = new WDIOInterface()
    iface.out = jest.fn()
    iface.err = jest.fn()
})

test('can clear lines', () => {
    iface.clearLine()
    expect(iface.out.mock.calls).toEqual([['eraseStartLine'], ['cursorLeft']])
})

test('can log', () => {
    iface.log('foo', 'bar')
    expect(iface.out.mock.calls).toEqual([['foo bar\n']])
})

test('can write', () => {
    iface.write('foobar')
    expect(iface.out.mock.calls).toEqual([['foobar']])
})

test('can wrap stdout or stderr', () => {
    const buffer = []
    const stream = { write: jest.fn() }
    iface.wrapStdio(stream, buffer)
    stream.write('foobar')
    expect(buffer).toHaveLength(1)
})

test('writes to stream if in debug mode', () => {
    const buffer = []
    const stream = { write: jest.fn() }
    iface.wrapStdio(stream, buffer)
    iface.inDebugMode = true
    stream.write('foobar')
    expect(buffer).toHaveLength(0)
})

test('clearBuffer', () => {
    iface.stdoutBuffer.push(1, 2, 3, 4)
    iface.stderrBuffer.push(1, 2)
    expect(iface.stdoutBuffer).toHaveLength(4)
    expect(iface.stderrBuffer).toHaveLength(2)
    iface.clearBuffer()
    expect(iface.stdoutBuffer).toHaveLength(0)
    expect(iface.stderrBuffer).toHaveLength(0)
})
