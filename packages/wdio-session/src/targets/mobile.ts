import { notSupported } from '../errors.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function appiumTargetPlan (..._args: any[]): Promise<any> {
    throw notSupported('This target is not implemented yet.')
}
