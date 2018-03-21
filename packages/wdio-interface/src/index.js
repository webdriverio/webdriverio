import { isInteractive } from './utils'

export default class CLIInterface {
    constructor () {
        this.clear = ''
        this.height = 0
        this.stdoutHandler = () => {}
        this.bufferedOutput = new Set()
        this.out = process.stdout.write.bind(process.stdout)
        this.err = process.stderr.write.bind(process.stderr)
        this.wrapStdio(process.stdout)
        this.wrapStdio(process.stderr)

        this.clearAll()
    }

    onStdout (stdoutHandler) {
        this.stdoutHandler = stdoutHandler
    }

    wrapStdio(stream) {
        const originalWrite = stream.write

        let buffer = []
        let timeout = null

        const flushBufferedOutput = () => {
            const string = buffer.join('')
            buffer = [];

            /**
             * This is to avoid conflicts between random output and status text
             */
            this.clearAll()

            if (string) {
                originalWrite.call(stream, string)
            }

            this.stdoutHandler()
            this.bufferedOutput.delete(flushBufferedOutput);
        };

        this.bufferedOutput.add(flushBufferedOutput);

        const debouncedFlush = () => {
            // If the process blows up no errors would be printed.
            // There should be a smart way to buffer stderr, but for now
            // we just won't buffer it.
            if (stream === process.stderr) {
                return flushBufferedOutput();
            }

            if (!timeout) {
                timeout = setTimeout(() => {
                    flushBufferedOutput();
                    timeout = null;
                }, 100);
            }
        }

        stream.write = (chunk) => {
            buffer.push(chunk)
            debouncedFlush()
            return true
        }
    }

    clearAll () {
        if (!isInteractive) {
            return
        }

        process.stdout.write('\x1B[2J\x1B[0f\u001b[0;0H')
    }

    clearLine () {
        if (!isInteractive) {
            return
        }

        this.out('\r\x1B[K\r\x1B[1A'.repeat(this.height))
        this.height = 0
    }

    log(...messages) {
        this.height++
        process.stderr.write(messages.join('') + '\n');
    }
}
