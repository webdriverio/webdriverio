
export type WDIOErrorEvent = Partial<Pick<ErrorEvent, 'filename' | 'message' | 'error'>> & { hasViteError?: boolean }

export interface Event {
    type: string
    title: string
    fullTitle: string
    specs: string[]
}

export interface TestState {
    failures: number
    events: Event[]
    errors?: WDIOErrorEvent[]
    hasViteError?: boolean
}

export interface LogMessage {
    level: string
    message: string
    source: string
    timestamp: number
}

export type BrowserData = {
    sessionId: string
    isW3C: boolean
    protocol: string
    hostname: string
    port: number
    path: string
    queryParams: Record<string, string>
}

export interface SnapshotResultMessage {
    origin: 'worker'
    name: 'snapshot'
    content: {
        filepath: string
        added: number
        fileDeleted: boolean
        matched: number
        unchecked: number
        uncheckedKeys: string[]
        unmatched: number
        updated: number
    }[]
}

export interface SessionEndedMessage {
    origin: 'worker'
    name: 'sessionEnded',
    cid: string
}
