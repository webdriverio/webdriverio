import { notSupported } from './errors.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function skill (..._args: any[]): Promise<any> {
    throw notSupported('Not implemented yet.')
}
