import util from 'util'
import ansiEscapes from 'ansi-escapes'

export default class CLInterface {
    constructor () {
        this.i = 0
        this.stdoutBuffer = []
        this.stderrBuffer = []
        this.out = ::process.stdout.write
        this.err = ::process.stderr.write
        this.inDebugMode = false

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
        const out = ::stream.write
        stream.write = chunk => {
            if (this.inDebugMode) {
                return out(chunk)
            }

            buffer.push(chunk)
            return true
        }
    }

    clearBuffer () {
        for (let i = this.stdoutBuffer.length; i > 0; --i) {
            this.stdoutBuffer.pop()
        }
        for (let i = this.stderrBuffer.length; i > 0; --i) {
            this.stderrBuffer.pop()
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
