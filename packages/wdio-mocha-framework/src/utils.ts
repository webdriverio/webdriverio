import type { MochaContext } from './types'

export function loadModule (name: string, context: MochaContext) {
    try {
        // @ts-ignore
        module.context = context
        return import(name)
    } catch (err: any) {
        throw new Error(`Module ${name} can't get loaded. Are you sure you have installed it?\n` +
                        'Note: if you\'ve installed WebdriverIO globally you need to install ' +
                        'these external modules globally too!')
    }
}
