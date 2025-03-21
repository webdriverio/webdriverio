import logger from '@wdio/logger'
import { commandCallStructure, isValidParameter, getArgumentType, transformCommandLogResult } from '@wdio/utils'
import { WebDriverBidiProtocol, type CommandEndpoint } from '@wdio/protocols'

import { environment } from './environment.js'
import type { BidiHandler } from './bidi/handler.js'
import type { WebDriverResponse } from './request/types.js'
import type { BaseClient, BidiCommands, BidiResponses, WebDriverResultEvent } from './types.js'
import { mask } from './utils.js'

const log = logger('webdriver')
const BIDI_COMMANDS: BidiCommands[] = Object.values(WebDriverBidiProtocol).map((def) => def.socket.command)
const sessionAbortListeners = new Map<string, Set<AbortController> | null>()

export default function (
    method: string,
    endpointUri: string,
    commandInfo: CommandEndpoint,
    doubleEncodeVariables = false
) {
    const { command, deprecated, ref, parameters, variables = [], isHubCommand = false } = commandInfo

    return async function protocolCommand (this: BaseClient, ...args: unknown[]): Promise<WebDriverResponse | BidiResponses | void> {
        const isBidiCommand = BIDI_COMMANDS.includes(command as BidiCommands)
        let endpoint = endpointUri // clone endpointUri in case we change it
        const commandParams = [...variables.map((v) => Object.assign(v, {
            /**
             * url variables are:
             */
            required: true, // always required as they are part of the endpoint
            type: 'string'  // have to be always type of string
        })), ...parameters]

        const commandUsage = `${command}(${commandParams.map((p) => p.name).join(', ')})`
        const moreInfo = `\n\nFor more info see ${ref}\n`
        const body: Record<string, unknown> = {}

        /**
         * log deprecation warning if command is deprecated
         *
         * Note: there are situations where we have to use deprecated commands, e.g. `switchToFrame`
         * internally where we don't want to have the message shown to the user. In these cases we
         * use the `DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS` env variable to suppress the message.
         */
        if (typeof deprecated === 'string' && !process.env.DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS) {
            const warning = deprecated.replace('This command', `The "${command}" command`)
            log.warn(warning)
            console.warn(`⚠️ [WEBDRIVERIO DEPRECATION NOTICE] ${warning}`)
        }

        /**
         * Throw this error message for all WebDriver Bidi commands.
         * In case a successful connection to the browser bidi interface was established,
         * we attach a custom Bidi prototype to the browser instance.
         */
        if (isBidiCommand) {
            throw new Error(
                `Failed to execute WebDriver Bidi command "${command}" as no Bidi session ` +
                'was established. Make sure you enable it by setting "webSocketUrl: true" ' +
                'in your capabilities and verify that your environment and browser supports it.'
            )
        }

        /**
         * parameter check
         */
        const minAllowedParams = commandParams.filter((param) => param.required).length
        if (args.length < minAllowedParams || args.length > commandParams.length) {
            const parameterDescription = commandParams.length
                ? `\n\nProperty Description:\n${commandParams.map((p) => `  "${p.name}" (${p.type}): ${p.description}`).join('\n')}`
                : ''

            throw new Error(
                `Wrong parameters applied for ${command}\n` +
                `Usage: ${commandUsage}` +
                parameterDescription +
                moreInfo
            )
        }

        /**
         * parameter type check
         */
        for (const [it, arg] of Object.entries(args)) {
            if (isBidiCommand) {
                break
            }
            const i = parseInt(it, 10)
            const commandParam = commandParams[i]

            if (!isValidParameter(arg, commandParam.type)) {
                /**
                 * ignore if argument is not required
                 */
                if (typeof arg === 'undefined' && !commandParam.required) {
                    continue
                }

                const actual = commandParam.type.endsWith('[]')
                    ? `(${(Array.isArray(arg) ? arg : [arg]).map((a) => getArgumentType(a))})[]`
                    : getArgumentType(arg)
                throw new Error(
                    `Malformed type for "${commandParam.name}" parameter of command ${command}\n` +
                    `Expected: ${commandParam.type}\n` +
                    `Actual: ${actual}` +
                    moreInfo
                )
            }

            /**
             * inject url variables
             */
            if (i < variables.length) {
                const encodedArg = doubleEncodeVariables ? encodeURIComponent(encodeURIComponent(arg as string)) : encodeURIComponent(arg as string)
                endpoint = endpoint.replace(`:${commandParams[i].name}`, encodedArg)
                continue
            }

            /**
             * rest of args are part of body payload
             */
            body[commandParams[i].name] = arg
        }

        /**
         * Make sure we pass along an abort signal to the request class so we
         * can abort the request as well as any retries in case the session is
         * deleted.
         *
         * Abort the attempt to make the WebDriver call, except for:
         *   - `deleteSession` calls which should go through in case we retry the command.
         *   - requests that don't require a session.
         */
        const { isAborted, abortSignal, cleanup } = manageSessionAbortions.call(this)
        const requiresSession = endpointUri.includes('/:sessionId/')
        if (isAborted && command !== 'deleteSession' && requiresSession) {
            throw new Error(`Trying to run command "${commandCallStructure(command, args)}" after session has been deleted, aborting request without executing it`)
        }

        /**
        * Masking text value when having the parameter mask set to true
        */
        const { maskedBody, maskedArgs } = mask(commandInfo, body, args)

        const request = new environment.value.Request(method, endpoint, body, abortSignal, isHubCommand, {
            onPerformance: (data) => this.emit('request.performance', { ...data, request: {
                ...data.request,
                body: maskedBody || data.request.body
            } }),
            onRequest: (data) => this.emit('request.start', { ...data, body: maskedBody || data.body }),
            onResponse: (data) => this.emit('request.end', data),
            onRetry: (data) => this.emit('request.retry', data),
            onLogData: (data) => log.info('DATA', transformCommandLogResult((maskedBody || data) as Record<string, unknown>))
        })
        this.emit('command', { command, method, endpoint, body: maskedBody || body })
        log.info('COMMAND', commandCallStructure(command, maskedArgs || args))

        const options = maskedBody ? { ...this.options, headers: { ['x-appium-is-sensitive']: 'true' } } : this.options

        /**
         * use then here so we can better unit test what happens before and after the request
         */
        return request.makeRequest(options, this.sessionId).then((result) => {
            if (typeof result.value !== 'undefined') {
                let resultLog = result.value

                if (/screenshot|recording/i.test(command) && typeof result.value === 'string' && result.value.length > 64) {
                    resultLog = `${result.value.slice(0, 61)}...`
                } else if (command === 'executeScript' && typeof body.script === 'string' && body.script.includes('(() => window.__wdioEvents__)')) {
                    resultLog = `[${(result.value as unknown[]).length} framework events captured]`
                }

                log.info('RESULT', resultLog)
            }

            this.emit('result', { command, method, endpoint, body: maskedBody || body, result })

            if (command === 'deleteSession') {
                /**
                 * close WebDriver Bidi socket
                 */
                const browser = this as { _bidiHandler?: BidiHandler }
                browser._bidiHandler?.close()

                const shutdownDriver = (body.deleteSessionOpts as { shutdownDriver?: boolean })?.shutdownDriver !== false
                /**
                 * kill driver process if there is one
                 */
                if (shutdownDriver && 'wdio:driverPID' in this.capabilities && this.capabilities['wdio:driverPID']) {
                    log.info(`Kill driver process with PID ${this.capabilities['wdio:driverPID']}`)
                    try {
                        const killedSuccessfully = process.kill(this.capabilities['wdio:driverPID'], 'SIGKILL')
                        if (!killedSuccessfully) {
                            log.warn('Failed to kill driver process, manually clean-up might be required')
                        }
                    } catch (err) {
                        log.warn('Failed to kill driver process', err)
                    }

                    setTimeout(() => {
                        /**
                         * clear up potential leaked TLS Socket handles
                         * see https://github.com/puppeteer/puppeteer/pull/10667
                         */
                        for (const handle of process._getActiveHandles()) {
                            if (handle.servername && handle.servername.includes('edgedl.me')) {
                                handle.destroy()
                            }
                        }
                    }, 10)
                }

                /**
                 * clear logger stream if session has been terminated
                 */
                if (!process.env.WDIO_WORKER_ID) {
                    logger.clearLogger()
                }
            }

            return result.value as WebDriverResponse | BidiResponses
        }).catch((error) => {
            this.emit('result', { command, method, endpoint, body: maskedBody || body, result: { error } })
            throw error
        }).finally(() => {
            cleanup()
        })
    }
}

/**
 * Manage session abortions, e.g. abort requests after session has been deleted.
 * @param this - WebDriver client instance
 * @returns Object with `isAborted`, `abortSignal`, and `cleanup`
 */
function manageSessionAbortions (this: BaseClient): {
    isAborted: boolean
    abortSignal?: AbortSignal
    cleanup: () => void
} {
    const abort = new AbortController()
    const abortOnSessionEnd = (result: WebDriverResultEvent) => {
        if (result.command !== 'deleteSession') {
            return
        }
        const abortListeners = sessionAbortListeners.get(this.sessionId)
        if (abortListeners) {
            for (const abortListener of abortListeners) {
                abortListener.abort()
            }
            abortListeners.clear()
            sessionAbortListeners.set(this.sessionId, null)
        }

    }

    let abortListenerForCurrentSession = sessionAbortListeners.get(this.sessionId)
    if (typeof abortListenerForCurrentSession === 'undefined') {
        abortListenerForCurrentSession = new Set()
        sessionAbortListeners.set(this.sessionId, abortListenerForCurrentSession)
        this.on('result', abortOnSessionEnd)
    }

    /**
     * If the session has been deleted, we don't want to run any further commands
     */
    if (abortListenerForCurrentSession === null) {
        return { isAborted: true, abortSignal: undefined, cleanup: () => {} }
    }

    /**
     * listen for session deletion and abort all requests
     */
    abortListenerForCurrentSession.add(abort)

    return {
        isAborted: false,
        abortSignal: abort.signal,
        cleanup: () => {
            this.off('result', abortOnSessionEnd)
            abortListenerForCurrentSession?.delete(abort)
        }
    }
}