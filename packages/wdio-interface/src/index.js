import util from 'util'
import ansiEscapes from 'ansi-escapes'

export default class CLInterface {
    constructor () {
        this.i = 0
        this.stdoutBuffer = []
        this.stderrBuffer = []
        this.out = ::process.stdout.write
        this.err = ::process.stderr.write

        this.clearAll()

        /**
         * don't modify stdout and stderr streams for unit tests
         */
        /* istanbul ignore if */
        if (!process.env.WDIO_TEST) {
            this.wrapStdio(process.stdout, this.stdoutBuffer)
            this.wrapStdio(process.stderr, this.stderrBuffer)
        }
    }

    wrapStdio(stream, buffer) {
        stream.write = chunk => {
            buffer.push(chunk)
            return true
        }
    }

    clearAll () {
        this.out(ansiEscapes.clearScreen)
    }

    clearLine () {
        this.out(ansiEscapes.eraseStartLine)
        this.out(ansiEscapes.cursorLeft)
    }

    log(...messages) {
        this.out(util.format.apply(this, messages) + '\n')
    }

    write (message) {
        this.out(message)
    }
}
