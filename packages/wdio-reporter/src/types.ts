export interface Tag {
    name: string;
    line: number;
}

export interface CommonArgs {
    sessionId: string
}

export interface CommandArgs extends CommonArgs {
    command?: string
    method?: string
    endpoint?: string

    /**
     * DevTools params
     */
    retries?: number
    params?: unknown
}
export interface CommonAfterCommandArgs {
    result: unknown | { error: unknown }
}

export interface BeforeCommand extends CommandArgs {
    body: unknown
}
export interface AfterCommand extends CommandArgs, CommonAfterCommandArgs {}

export interface CustomCommand extends CommonArgs {
    name: string
    args: unknown[]
}
export interface AfterCustomCommand extends CommonArgs, CommonAfterCommandArgs {}

export type BeforeCommandArgs = BeforeCommand | CustomCommand
export type AfterCommandArgs = AfterCommand | AfterCustomCommand

export interface Argument {
    rows?: {
        cells: string[]
    }[]
}
