import { commands } from 'virtual:wdio'
import { webdriverMonad } from '@wdio/utils'
import { getEnvironmentVars } from 'webdriver'

import browserCommands from './commands/index.js'

const COMMAND_TIMEOUT = 30 * 1000 // 30s

export default class ProxyDriver {
    static newSession (
        params: any,
        modifier: never,
        userPrototype: Record<string, PropertyDescriptor>,
        commandWrapper: any
    ) {
        const commandMessages = new Map<number, any>()
        const wsUrl = 'ws://' + window.location.host + '/ws'
        const [cid] = window.location.pathname.slice(1).split('/')
        if (!cid) {
            throw new Error('"cid" query parameter is missing')
        }

        console.log(`[WDIO] Connect to testrunner: ${wsUrl}`)
        const socket = new WebSocket(wsUrl)
        const connectPromise = new Promise((resolve) => {
            console.log('[WDIO] Connected to testrunner')
            socket.addEventListener('open', resolve)
        })
        socket.addEventListener('message', (ev) => {
            try {
                const payload = JSON.parse(ev.data)
                if (!payload.id) {
                    return console.error(`Message without id: ${JSON.stringify(ev.data)}`)
                }

                const commandMessage = commandMessages.get(payload.id)
                if (!commandMessage) {
                    return console.error(`Unknown command id "${payload.id}"`)
                }
                if (payload.error) {
                    console.log(`${(new Date()).toISOString()} - id: ${payload.id} - ERROR: ${JSON.stringify(payload.result)}`)
                    return commandMessage.reject(new Error(payload.error))
                }
                console.log(`${(new Date()).toISOString()} - id: ${payload.id} - RESULT: ${JSON.stringify(payload.result)}`)
                commandMessage.resolve(payload.result)
            } catch (err: any) {
                console.error(`Failed handling command socket message "${err.message}"`)
            }
        })

        let commandId = 0
        const environmentPrototype: Record<string, PropertyDescriptor> = getEnvironmentVars(params)
        const protocolCommands = commands.reduce((prev, commandName) => {
            prev[commandName] = {
                value: async (...args: unknown[]) => {
                    if (socket.readyState !== 1) {
                        await connectPromise
                    }
                    commandId++
                    console.log(`${(new Date()).toISOString()} - id: ${commandId} - COMMAND: ${commandName}(${args.join(', ')})`)
                    socket.send(JSON.stringify({ commandName, args, id: commandId, cid }))
                    return new Promise((resolve, reject) => {
                        const commandTimeout = setTimeout(
                            () => reject(new Error(`Command "${commandName}" timed out`)),
                            COMMAND_TIMEOUT
                        )
                        commandMessages.set(commandId, { resolve, reject, commandTimeout })
                    })
                }
            }
            return prev
        }, {} as Record<string, { value: Function }>)

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
             * custom browser specific commands
             */
            ...browserCommands
        }
        prototype.emit = { writable: true, value: () => {} }
        prototype.on = { writable: true, value: () => {} }

        const monad = webdriverMonad(params, modifier, prototype)
        return monad(window.__wdioEnv__.sessionId, commandWrapper)
    }
}
