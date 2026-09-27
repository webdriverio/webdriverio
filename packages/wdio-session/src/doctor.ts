import { notSupported } from './errors.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runDoctor (..._args: any[]): Promise<any> {
    throw notSupported('Not implemented yet.')
}
