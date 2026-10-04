/**
 * The transform removes this type, so the line of the error in the served
 * file is not the line in this file.
 */
export interface StackOptions {
    message: string
}

export function getStack (options: StackOptions = { message: 'fixture' }) {
    return new Error(options.message).stack!
}
