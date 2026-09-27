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
}

export interface Argument {
    rows?: {
        cells: string[]
    }[]
}
