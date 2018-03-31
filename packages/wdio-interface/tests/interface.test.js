import WDIOInterface from '../src'

process.env.WDIO_TEST = 1

describe('WDIOInterface', () => {
    let iface

    beforeEach(() => {
        iface = new WDIOInterface()
        iface.out = jest.fn()
        iface.err = jest.fn()
    })

    it('can clear lines', () => {
        iface.clearLine()
        expect(iface.out.mock.calls).toEqual([['eraseStartLine'], ['cursorLeft']])
    })

    it('can log', () => {
        iface.log('foo', 'bar')
        expect(iface.out.mock.calls).toEqual([['foo bar\n']])
    })

    it('can write', () => {
        iface.write('foobar')
        expect(iface.out.mock.calls).toEqual([['foobar']])
    })

    it('can wrap stdout or stderr', () => {
        const buffer = []
        const stream = {}
        iface.wrapStdio(stream, buffer)
        stream.write('foobar')
        expect(buffer).toHaveLength(1)
    })
})

// clearLine () {
//     this.out(ansiEscapes.eraseStartLine)
//     this.out(ansiEscapes.cursorLeft)
// }
//
// log(...messages) {
//     this.out(util.format.apply(this, messages) + '\n')
// }
//
// write (message) {
//     this.out(message)
// }
