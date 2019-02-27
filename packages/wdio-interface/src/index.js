import util from 'util'
import EventEmitter from 'events'
import ansiEscapes from 'ansi-escapes'

export default class CLInterface extends EventEmitter {
    constructor () {
        super()
        this.i = 0
        this.stdoutBuffer = []
        this.stderrBuffer = []
        this.out = ::process.stdout.write
        this.err = ::process.stderr.write
        this.inDebugMode = false

        this.out(ansiEscapes.clearScreen)

        this.lineCount = 0

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
            this.emit('bufferchange', chunk)
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
        this.out(ansiEscapes.eraseLines(this.lineCount))
        this.lineCount = 0
    }

    clearLine () {
        this.out(ansiEscapes.eraseStartLine)
        this.out(ansiEscapes.cursorLeft)
    }

    log(...messages) {
        let newLines = messages.length
        if (newLines > 0) {
            // get number of new lines in each message
            const newLineCounts = messages.map(msg => msg.split('\n').length)
            // sum up and add to total number of messages
            newLines += newLineCounts.reduce((partialSum, newLineCount) => partialSum + newLineCount)
        }
        this.lineCount += newLines
        this.out(util.format.apply(this, messages) + '\n')
    }

    write (message) {
        this.out(message)
        this.lineCount++
    }

    reset () {
        process.stdout.write = this.out
        process.stderr.write = this.err
    }
}
