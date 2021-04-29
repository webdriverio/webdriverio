import split = require('split2')
import { Transform, Stream } from 'stream'
import { DEBUGGER_MESSAGES } from './constants'

export default function runnerTransformStream(stream: Stream | null, cid: string): Stream | undefined {
    return stream?.pipe(split())
        .pipe(ignore(DEBUGGER_MESSAGES))
        .pipe(map(line => `[${cid}] ${line}\n`))
}

function ignore(patternsToIgnore: string[]) {
    return new Transform({
        decodeStrings: false,
        transform(chunk, encoding, next) {
            if (patternsToIgnore.some(m => chunk.startsWith(m))) {
                return next()
            }
            return next(null, chunk)
        },
    })
}

function map(mapper: (line: string) => string) {
    return new Transform({
        decodeStrings: false,
        transform(chunk, encoding, next) {
            return next(null, mapper(chunk))
        },
    })
}
