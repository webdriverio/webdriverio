export class FileStream {
    readableStream: any
    constructor(readableStream: any) {
        this.readableStream = readableStream
    }

    stream() {
        return this.readableStream
    }

    get [Symbol.toStringTag]() {
        return 'File'
    }
}
