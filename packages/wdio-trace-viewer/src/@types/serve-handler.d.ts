declare module 'serve-handler' {
    import { IncomingMessage, ServerResponse } from 'http'

    interface ServeHandlerOptions {
        public?: string
        cleanUrls?: boolean | string[]
        rewrites?: { source: string, destination: string }[]
        redirects?: { source: string, destination: string, type?: number }[]
        headers?: { source: string, headers: { key: string, value: string }[] }[]
    }

    export default function handler(
        req: IncomingMessage,
        res: ServerResponse,
        options?: ServeHandlerOptions
    ): Promise<void>
}
