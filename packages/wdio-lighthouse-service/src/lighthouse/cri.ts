import { CriConnection } from 'lighthouse/core/legacy/gather/connections/cri.js'

const DEFAULT_HOSTNAME = 'localhost'
const DEFAULT_PORT = 9222

/**
 * this class got patched to enable connecting to a remote path like
 * ws://192.168.0.39:4444/session/349a44a32846c2659c703e71403bd472/se/cdp
 * as it requires to attach to a session before.
 */
export default class ChromeProtocolPatched extends CriConnection {
    private _sessionId?: string

    /**
     * Add constructor for typing safety
     * @param {number=} port Optional port number. Defaults to 9222;
     * @param {string=} hostname Optional hostname. Defaults to localhost.
     * @constructor
     */
    constructor(port: number = DEFAULT_PORT, hostname: string = DEFAULT_HOSTNAME) {
        console.trace('Creating ChromeProtocolPatched instance with port:', port, 'and hostname:', hostname)
        super(port, hostname)
    }

    setSessionId (sessionId: string) {
        this._sessionId = sessionId
    }

    /**
     * force every command to be send with the given session id
     */
    sendCommand(method: string, sessionId?: string, ...paramArgs: unknown[]) {
        console.log('Sending command:', method, 'with sessionId:', sessionId || this._sessionId, 'and params:', paramArgs)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return super.sendCommand(method as any, sessionId || this._sessionId, ...paramArgs)
    }
}
