import split from 'split2'
import { Readable, Transform, TransformCallback } from 'node:stream'
import { DEBUGGER_MESSAGES } from './constants.js'

export default function runnerTransformStream(cid: string, inputStream: Readable): Readable {
    return inputStream
        .pipe(split(/\r?\n/, line => `${line}\n`))
        .pipe(ignore(DEBUGGER_MESSAGES))
        .pipe(map(line => `[${cid}] ${line}`))
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
        final(next: TransformCallback): void {
            this.unpipe()
            next()
        },
    })
}

function map(mapper: (line: string) => string) {
    return new Transform({
        decodeStrings: false,
        transform(chunk: any, encoding: BufferEncoding, next: TransformCallback) {
            return next(null, mapper(chunk))
        },
        final(next: TransformCallback): void {
            this.unpipe()
            next()
        },
    })
}
