import { notSupported } from '../errors.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function nativeWebviewPlan (..._args: any[]): Promise<any> {
    throw notSupported('This target is not implemented yet.')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function startDriver (..._args: any[]): Promise<any> {
    throw notSupported('This target is not implemented yet.')
}
