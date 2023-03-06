import stringify from 'fast-safe-stringify'

import { commands } from 'virtual:wdio'
import { webdriverMonad, sessionEnvironmentDetector } from '@wdio/utils'
import { getEnvironmentVars } from 'webdriver'

import { getCID } from './utils.js'
import { MESSAGE_TYPES } from '../constants.js'
import type { SocketMessage, SocketMessagePayload, ConsoleEvent, CommandRequestEvent } from '../vite/types.js'

const COMMAND_TIMEOUT = 30 * 1000 // 30s
const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const
interface CommandMessagePromise {
    resolve: (value: unknown) => void
    reject: (err: Error) => void
    commandTimeout?: NodeJS.Timeout
}

export default class ProxyDriver {
    static #commandMessages = new Map<string, CommandMessagePromise>()

    static newSession (
        params: any,
        modifier: never,
        userPrototype: Record<string, PropertyDescriptor>,
        commandWrapper: any
    ) {
        const cid = getCID()
        if (!cid) {
            throw new Error('"cid" query parameter is missing')
        }

        /**
         * log all console events once connected
         */
        const connectPromise = window.__wdioConnectPromise__
        connectPromise.then(this.#wrapConsolePrototype.bind(this, cid))

        /**
         * handle Vite server socket messages
         */
        const socket = window.__wdioSocket__
        socket.addEventListener('message', this.#handleServerMessage.bind(this))

        let commandId = 0
        const environment = sessionEnvironmentDetector({ capabilities: params.capabilities, requestedCapabilities: {} })
        const environmentPrototype: Record<string, PropertyDescriptor> = getEnvironmentVars(environment)
        // have debug command
        const commandsProcessedInNodeWorld = [...commands, 'debug']
        const protocolCommands = commandsProcessedInNodeWorld.reduce((prev, commandName) => {
            const isDebugCommand = commandName === 'debug'
            prev[commandName] = {
                value: async (...args: unknown[]) => {
                    if (socket.readyState !== 1) {
                        await connectPromise
                    }
                    commandId++

                    /**
                     * print information which command is executed (except for debug commands)
                     */
                    console.log(...(isDebugCommand
                        ? ['[WDIO] %cDebug Mode Enabled', 'background: #ea5906; color: #fff; padding: 3px; border-radius: 5px;']
                        : [`[WDIO] ${(new Date()).toISOString()} - id: ${commandId} - COMMAND: ${commandName}(${args.join(', ')})`]
                    ))

                    socket.send(JSON.stringify(this.#commandRequest({
                        commandName,
                        cid,
                        id: commandId.toString(),
                        args
                    })))
                    return new Promise((resolve, reject) => {
                        let commandTimeout
                        if (!isDebugCommand) {
                            commandTimeout = setTimeout(
                                () => reject(new Error(`Command "${commandName}" timed out`)),
                                COMMAND_TIMEOUT
                            )
                        }

                        this.#commandMessages.set(commandId.toString(), { resolve, reject, commandTimeout })
                    })
                }
            }
            return prev
        }, {} as Record<string, { value: Function }>)

        /**
         * handle debug command on the server side
         */
        delete userPrototype.debug

        const prototype = {
            /**
             * custom protocol commands that communicate with Vite
             */
            ...protocolCommands,
            /**
             * environment flags
             */
            ...environmentPrototype,
            /**
             * unmodified WebdriverIO commands
             */
            ...userPrototype
        }
        prototype.emit = { writable: true, value: () => {} }
        prototype.on = { writable: true, value: () => {} }

        const monad = webdriverMonad(params, modifier, prototype)
        return monad(window.__wdioEnv__.sessionId, commandWrapper)
    }

    static #handleServerMessage (ev: MessageEvent) {
        try {
            const { type, value } = JSON.parse(ev.data) as SocketMessagePayload<MESSAGE_TYPES.commandResponseMessage>
            if (type !== MESSAGE_TYPES.commandResponseMessage) {
                return
            }

            if (!value.id) {
                return console.error(`Message without id: ${JSON.stringify(ev.data)}`)
            }

            const commandMessage = this.#commandMessages.get(value.id)
            if (!commandMessage) {
                return console.error(`Unknown command id "${value.id}"`)
            }
            if (value.error) {
                console.log(`[WDIO] ${(new Date()).toISOString()} - id: ${value.id} - ERROR: ${JSON.stringify(value.error.message)}`)
                return commandMessage.reject(new Error(value.error.message || 'unknown error'))
            }
            if (commandMessage.commandTimeout) {
                clearTimeout(commandMessage.commandTimeout)
            }
            console.log(`[WDIO] ${(new Date()).toISOString()} - id: ${value.id} - RESULT: ${JSON.stringify(value.result)}`)
            commandMessage.resolve(value.result)
            this.#commandMessages.delete(value.id)
        } catch (err: any) {
            console.error(`Failed handling command socket message "${err.message}"`)
        }
    }

    static #wrapConsolePrototype (cid: string) {
        const socket = window.__wdioSocket__
        for (const method of CONSOLE_METHODS) {
            const origCommand = console[method].bind(console)
            console[method] = (...args: unknown[]) => {
                socket.send(stringify(this.#consoleMessage({
                    name: 'consoleEvent',
                    type: method,
                    args,
                    cid
                })))
                origCommand(...args)
            }
        }
    }

    static #commandRequest (value: CommandRequestEvent): SocketMessage {
        return {
            type: MESSAGE_TYPES.commandRequestMessage,
            value
        }
    }

    static #consoleMessage (value: ConsoleEvent): SocketMessage {
        return {
            type: MESSAGE_TYPES.consoleMessage,
            value
        }
    }
}
