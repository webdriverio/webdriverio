import type { Frameworks } from '@wdio/types'

export interface Tag {
    name: string;
    line: number;
}

export interface CommandArgs {
    sessionId: string
    method?: string
    endpoint?: string

    /**
     * DevTools params
     */
    retries?: number
    command?: string
    params?: unknown
    contextId?: string
    /**
     * Id of the user command that runs this protocol command, in WebDriver BiDi sessions only
     * @experimental
     */
    parent?: number
    /**
     * Id of the user command that runs this screenshot command, which has no `parent` so that every reporter gets it
     * @experimental
     */
    owner?: number
    /**
     * `true` for the old event of a custom command that is itself the user command `parent`: the user command replaces it
     * @experimental
     */
    custom?: boolean
}

export interface BeforeCommandArgs extends CommandArgs {
    body: unknown
}

export interface AfterCommandArgs extends CommandArgs {
    result: unknown
}

/**
 * Payload of `client:beforeUserCommand`: a command that the test code calls directly (a WebdriverIO
 * command or a custom command), sent in WebDriver BiDi sessions only. The body is masked and short.
 * @experimental the name and the fields may change
 */
export interface BeforeUserCommandArgs {
    /** The `parent` of the protocol commands that this user command runs */
    id: number
    command: string
    body: unknown[]
    protocol: 'bidi'
    sessionId: string
    contextId?: string
    /** The item of the list of `command` that this user command waits for: `` $$(`li`)[3] `` */
    index?: number
}

/**
 * Payload of `client:afterUserCommand`
 * @experimental the name and the fields may change
 */
export interface AfterUserCommandArgs extends BeforeUserCommandArgs {
    result: { value: unknown } | { error: unknown }
}

/**
 * Payload of `context:end`: the context of a parallel test sends no more events
 * @experimental sent in Mocha and Cucumber `parallelMode` and for Vitest concurrent tests; the name and the fields may change
 */
export interface ContextEnd {
    cid: string
    specs?: string[]
    /** uid of the last test of the context (Cucumber: of its scenario, when the scenario has no step) */
    uid: string
    contextId: string
}

export interface Argument {
    rows?: {
        cells: string[]
    }[]
}

/** The kind of a hook, sent by the framework adapter. @experimental */
export type HookKind = Frameworks.HookKind

export type { ReporterUnit } from './units.js'
