import util from 'util'
import ansiEscapes from 'ansi-escapes'

// import { isInteractive } from './utils'

export default class CLIInterface {
    constructor () {
        this.i = 0
        this.stdoutBuffer = []
        this.stderrBuffer = []
        this.out = process.stdout.write.bind(process.stdout)
        this.err = process.stderr.write.bind(process.stderr)

        this.clearAll()
        this.wrapStdio(process.stdout, this.stdoutBuffer)
        this.wrapStdio(process.stderr, this.stderrBuffer)
    }

    getStdout () {
        const stdout = this.stdoutBuffer.join('')
        this.stdoutBuffer = []
        return stdout
    }

    getStderr () {
        const stderr = this.stderrBuffer.join('')
        this.stderrBuffer = []
        return stderr
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
