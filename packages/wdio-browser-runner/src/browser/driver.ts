/// <reference types="@wdio/globals/types" />
import { commands } from 'virtual:wdio'
import { webdriverMonad, sessionEnvironmentDetector } from '@wdio/utils'
import { getEnvironmentVars, initiateBidi, parseBidiMessage } from 'webdriver'
import { MESSAGE_TYPES, type Workers } from '@wdio/types'
import { browser } from '@wdio/globals'
import safeStringify from 'safe-stringify'

/**
 * this is a polyfill to use event emitter in browser
 */
// eslint-disable-next-line unicorn/prefer-node-protocol
import EventEmitter from 'events'

import { getCID, sanitizeConsoleArgs } from './utils.js'
import { WDIO_EVENT_NAME } from '../constants.js'

const COMMAND_TIMEOUT = 30 * 1000 // 30s
const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const
interface CommandMessagePromise {
    resolve: (value: unknown) => void
    reject: (err: Error) => void
    commandName: string
    commandTimeout?: NodeJS.Timeout
}

const HIDE_REPORTER_FOR_COMMANDS = ['saveScreenshot', 'savePDF']
const mochaFramework = document.querySelector('mocha-framework')
let id = 0
export default class ProxyDriver {
    static #commandMessages = new Map<number, CommandMessagePromise>()

    static async newSession (
        params: any,
        modifier: never,
        userPrototype: Record<string, PropertyDescriptor>,
        commandWrapper: any
    ) {
        const cid = getCID()
        /**
         * log all console events once connected
         */
        this.#wrapConsolePrototype(cid)

        /**
         * listen on socket events from testrunner
         */
        import.meta.hot?.on(WDIO_EVENT_NAME, (payload: Workers.SocketMessage) => {
            try {
                this.#handleServerMessage(payload)
            } catch (err) {
                console.error(`Error in handling message: ${(err as Error).stack}`)
            }
        })

        const environment = sessionEnvironmentDetector({ capabilities: params.capabilities, requestedCapabilities: {} })
        const environmentPrototype: Record<string, PropertyDescriptor> = getEnvironmentVars(environment)
        // have debug command
        const commandsProcessedInNodeWorld = [...commands, 'debug', 'saveScreenshot', 'savePDF', 'emulate', 'restore']
        const protocolCommands = commandsProcessedInNodeWorld.reduce((prev, commandName) => {
            prev[commandName] = {
                value: this.#getMockedCommand(commandName)
            }
            return prev
        }, {} as Record<string, { value: Function }>)

        /**
         * handle certain commands on the server side
         */
        delete userPrototype.debug
        delete userPrototype.saveScreenshot
        delete userPrototype.savePDF

        /**
         * initiate WebDriver Bidi
         */
        const bidiPrototype: PropertyDescriptorMap = {}
        const webSocketUrl = 'alwaysMatch' in params.capabilities!
            ? params.capabilities.alwaysMatch?.webSocketUrl
            : params.capabilities!.webSocketUrl
        if (webSocketUrl) {
            Object.assign(bidiPrototype, initiateBidi(webSocketUrl as any as string))
        }

        /**
         * event prototype polyfill for the browser
         */
        const ee = new EventEmitter()
        const eventPrototype = {
            emit: { value: ee.emit.bind(ee) },
            on: { value: ee.on.bind(ee) },
            once: { value: ee.once.bind(ee) },
            removeListener: { value: ee.removeListener.bind(ee) },
            removeAllListeners: { value: ee.removeAllListeners.bind(ee) },
            off: { value: ee.off.bind(ee) }
        }

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
            ...userPrototype,
            /**
             * Bidi commands
             */
            ...bidiPrototype,
            /**
             * event emitter commands
             */
            ...eventPrototype
        }

        /**
         * register helper function to pass command execution into Node.js context
         */
        globalThis.wdio = {
            execute: <CommandName>(commandName: CommandName, ...args: any[]) => {
                return this.#getMockedCommand(commandName as string)(...args) as any
            },
            executeWithScope: <CommandName>(commandName: CommandName, scope: string, ...args: any[]) => {
                return this.#getMockedCommand(commandName as string, scope)(...args) as any
            }
        }

        const monad = webdriverMonad(params, modifier, prototype)
        const client = monad(window.__wdioEnv__.sessionId, commandWrapper)

        /**
         * parse and propagate all Bidi events to the browser instance
         */
        if (params.capabilities.webSocketUrl && client._bidiHandler) {
            // make sure the Bidi connection is established before returning
            await client._bidiHandler.connect()
            client._bidiHandler.socket.on('message', parseBidiMessage.bind(client))
        }

        /**
         * initiate browser state, e.g. register custom commands that were initiated
         * in Node.js land to the browser instance in the browser
         * Note: we only can do this after we have connected to above Bidi connection
         * otherwise the browser instance will not be registered in `@wdio/globals` at
         * the time we get a response for this message.
         */
        import.meta.hot?.send(WDIO_EVENT_NAME, {
            type: MESSAGE_TYPES.initiateBrowserStateRequest,
            value: { cid }
        })

        return client
    }

    /**
     * @param commandName name of command to execute
     * @param scope element id when command needs to be executed from an element scope
     */
    static #getMockedCommand (commandName: string, scope?: string) {
        const isDebugCommand = commandName === 'debug'
        return async (...args: unknown[]) => {
            if (!import.meta.hot) {
                throw new Error('Could not connect to testrunner')
            }

            id++

            /**
             * print information which command is executed (except for debug commands)
             */
            console.log(...(isDebugCommand
                ? ['[WDIO] %cDebug Mode Enabled', 'background: #ea5906; color: #fff; padding: 3px; border-radius: 5px;']
                : [`[WDIO] ${(new Date()).toISOString()} - id: ${id} - COMMAND: ${commandName}(${args.join(', ')})`]
            ))

            if (HIDE_REPORTER_FOR_COMMANDS.includes(commandName) && mochaFramework) {
                mochaFramework.setAttribute('style', 'display: none')
            }

            const cid = getCID()
            import.meta.hot.send(WDIO_EVENT_NAME, this.#commandRequest({
                commandName,
                cid,
                id,
                args,
                scope
            }))
            return new Promise((resolve, reject) => {
                let commandTimeout
                if (!isDebugCommand) {
                    commandTimeout = setTimeout(
                        () => reject(new Error(`Command "${commandName}" timed out`)),
                        COMMAND_TIMEOUT
                    )
                }

                this.#commandMessages.set(id, { resolve, reject, commandTimeout, commandName })
            })
        }
    }

    static #handleServerMessage (payload: Workers.SocketMessage) {
        if (payload.type === MESSAGE_TYPES.commandResponseMessage) {
            return this.#handleCommandResponse(payload.value)
        }
        if (payload.type === MESSAGE_TYPES.initiateBrowserStateResponse) {
            return this.#handleBrowserInitiation(payload.value)
        }
    }

    static #handleCommandResponse (value: Workers.CommandResponseEvent) {
        if (!value.id) {
            return console.error(`Message without id: ${JSON.stringify(value)}`)
        }

        const commandMessage = this.#commandMessages.get(value.id)
        if (!commandMessage) {
            return console.error(`Unknown command id "${value.id}"`)
        }

        if (HIDE_REPORTER_FOR_COMMANDS.includes(commandMessage.commandName) && mochaFramework) {
            mochaFramework.removeAttribute('style')
        }

        if (value.error) {
            console.log(`[WDIO] ${(new Date()).toISOString()} - id: ${value.id} - ERROR: ${JSON.stringify(value.error.message)}`)
            value.error.message = value.error.message || 'unknown error'
            return commandMessage.reject(value.error)
        }
        if (commandMessage.commandTimeout) {
            clearTimeout(commandMessage.commandTimeout)
        }
        console.log(`[WDIO] ${(new Date()).toISOString()} - id: ${value.id} - RESULT: ${JSON.stringify(value.result)}`)
        commandMessage.resolve(value.result)
        this.#commandMessages.delete(value.id)
    }

    /**
     * Initiate browser states even in case page loads happen. This is necessary so we can
     * add a custom command that was added in the Node.js environment to the browser scope
     * within the browser so the instance is aware of it and can translate the command
     * request back to the worker process
     */
    static #handleBrowserInitiation (value: Workers.BrowserState) {
        const cid = getCID()
        if (!cid) {
            return
        }
        for (const commandName of value.customCommands) {
            browser.addCommand(commandName, this.#getMockedCommand(commandName))
        }
    }

    static #wrapConsolePrototype (cid: string) {
        for (const method of CONSOLE_METHODS) {
            const origCommand = console[method].bind(console)
            console[method] = (...args: unknown[]) => {
                import.meta.hot?.send(WDIO_EVENT_NAME, this.#consoleMessage({
                    name: 'consoleEvent',
                    type: method,
                    args: JSON.parse(safeStringify(sanitizeConsoleArgs(args))),
                    cid
                }))
                origCommand(...args)
            }
        }
    }

    static #commandRequest (value: Workers.CommandRequestEvent): Workers.SocketMessage {
        return {
            type: MESSAGE_TYPES.commandRequestMessage,
            value
        }
    }

    static #consoleMessage (value: Workers.ConsoleEvent): Workers.SocketMessage {
        return {
            type: MESSAGE_TYPES.consoleMessage,
            value
        }
    }
}
