declare module '@wdio/mocha-framework/common'

declare module 'virtual:wdio' {
    export const commands: string[]
    export const automationProtocolPath: string
}
