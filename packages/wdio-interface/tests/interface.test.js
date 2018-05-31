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
    const stream = {}
    iface.wrapStdio(stream, buffer)
    stream.write('foobar')
    expect(buffer).toHaveLength(1)
})
