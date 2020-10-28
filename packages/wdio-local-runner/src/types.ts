export interface WorkerRunPayload {
    cid: string,
    configFile: string,
    caps: WebDriver.Capabilities,
    specs: string[],
    execArgv: string[],
    retries: number
}

export interface WorkerMessage {
    name: string
    content: {
        sessionId?: string
        isMultiremote?: boolean
    }
    origin: string
    params: Record<string, string>
}
