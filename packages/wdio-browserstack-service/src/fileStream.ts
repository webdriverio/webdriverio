import type fs from 'node:fs'
import type zlib from 'node:zlib'

export class FileStream {
    readableStream: fs.ReadStream | zlib.Gzip
    constructor(readableStream: fs.ReadStream | zlib.Gzip) {
        this.readableStream = readableStream
    }

    stream() {
        return this.readableStream
    }

    get [Symbol.toStringTag]() {
        return 'File'
    }
}
