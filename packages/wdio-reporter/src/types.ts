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
}

export interface BeforeCommandArgs extends CommandArgs {
    body: unknown
}

export interface AfterCommandArgs extends CommandArgs {
    result: unknown

    /**
     * @deprecated Use `command` instead, moreover since the `onAfterCommand` was never called in the case of custom commands, it was breaking reports, and we do not emit this one in the fix!
     *
     * custom commands also send along the command name
     */
    name?: string
}

export interface Argument {
    rows?: {
        cells: string[]
    }[]
}
