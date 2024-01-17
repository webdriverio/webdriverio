export interface MockRequestEvent {
    path: string
    origin: string
    namedExports: string[]
}

export interface MockResponseEvent {
    path: string
}
