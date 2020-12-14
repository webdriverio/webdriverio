export interface MochaOpts extends Mocha.MochaOptions {
    require?: string[]
    compilers?: string[]
    invert?: boolean
}

export interface MochaConfig extends Required<WebdriverIO.Config> {
    mochaOpts: MochaOpts
}

export interface MochaError {
    name: string
    message: string
    stack: string
    type: string
    expected: any
    actual: any
}

export interface FrameworkMessage {
    type: string
    payload?: any
    err?: MochaError
}

export interface FormattedMessage {
    type: string
    cid?: string
    specs?: string[]
    uid?: string
    title?: string
    parent?: string
    fullTitle?: string
    pending?: boolean
    passed?: boolean
    file?: string
    duration?: number
    currentTest?: string
    error?: MochaError
    context?: any
}

export interface MochaContext {
    context: Mocha.MochaGlobals
    file: string
    mocha: Mocha
    options: MochaOpts
}
