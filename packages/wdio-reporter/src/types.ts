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
}

export interface BeforeCommandArgs extends CommandArgs {
    body: unknown
}

export interface AfterCommandArgs extends CommandArgs {
    result: unknown
}

/**
 * Payload of `context:end`: the browsing context of a parallel test sends no more events
 * @experimental sent in Mocha and Cucumber `parallelMode`; the name and the fields may change
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
