export interface CommandArgs {
    sessionId: string
    method?: string
    endpoint?: string

    /**
     * DevTools params
     */
    retries?: number
    command?: string
    params?: any
}

export interface BeforeCommandArgs extends CommandArgs {
    body: any
}

export interface AfterCommandArgs extends CommandArgs {
    result: any

    /**
     * custom commands also send along the command name
     */
    name?: string
}
