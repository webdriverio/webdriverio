import { spawn, fork } from 'node:child_process'
import type { ChildProcess, SpawnOptions, ForkOptions } from 'node:child_process'
import logger from '@wdio/logger'
import { DisplayServerManager } from './DisplayServerManager.js'
import type { DisplayServer } from './types.js'

export interface ProcessCreator {
    createWorkerProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions
    ): Promise<ChildProcess>
}

export interface ProcessCreationOptions {
    cwd?: string
    env?: Record<string, string>
    execArgv?: string[]
    stdio?: ('inherit' | 'pipe' | 'ignore' | 'ipc')[]
}

export class DisplayProcessFactory implements ProcessCreator {
    #displayServerManager: DisplayServerManager
    #log = logger('@wdio/display-server:DisplayProcessFactory')

    constructor(displayServerManager?: DisplayServerManager) {
        this.#displayServerManager = displayServerManager || new DisplayServerManager()
    }

    async createWorkerProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions
    ): Promise<ChildProcess> {
        const shouldRun = this.#displayServerManager.shouldRun()
        const displayServer = this.#displayServerManager.getDisplayServer()
        const isAvailable = displayServer !== null

        this.#log.info(`ProcessFactory: shouldRun=${shouldRun}, isAvailable=${isAvailable}`)

        if (shouldRun && isAvailable && displayServer) {
            this.#log.info(`Creating worker process with ${displayServer.name} wrapper`)

            return await this.#displayServerManager.executeWithRetry(
                () => this.#createDisplayServerProcess(scriptPath, args, options, displayServer),
                `${displayServer.name} worker process creation`
            )
        }

        this.#log.info('Creating worker process with regular fork')
        return this.#createRegularProcess(scriptPath, args, options)
    }

    /**
     * Create process wrapped with display server
     */
    #createDisplayServerProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions,
        displayServer: DisplayServer
    ): Promise<ChildProcess> {
        return new Promise((resolve, reject) => {
            const { cwd, env, execArgv = [], stdio } = options
            const nodeArgs = [...execArgv, scriptPath, ...args]

            const wrapper = displayServer.getProcessWrapper()
            if (!wrapper) {
                // No wrapping needed, use regular fork
                resolve(this.#createRegularProcess(scriptPath, args, options))
                return
            }

            // Merge display server environment with provided environment
            const displayEnv = displayServer.getEnvironment()
            const mergedEnv = { ...displayEnv, ...env }

            const childProcess = spawn(
                wrapper[0],
                [...wrapper.slice(1), 'node', ...nodeArgs],
                {
                    cwd,
                    env: mergedEnv,
                    stdio,
                } as SpawnOptions
            )

            // Check for immediate startup failures
            let resolved = false
            const startupTimeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true
                    resolve(childProcess)
                }
            }, 100)

            childProcess.on('error', (error) => {
                if (!resolved) {
                    resolved = true
                    clearTimeout(startupTimeout)
                    reject(error)
                }
            })

            childProcess.on('exit', (code, signal) => {
                if (!resolved && code !== 0) {
                    resolved = true
                    clearTimeout(startupTimeout)
                    reject(new Error(`${displayServer.name} process exited with code ${code} and signal ${signal}`))
                }
            })
        })
    }

    /**
     * Create regular process without display server
     */
    #createRegularProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions
    ): ChildProcess {
        const { cwd, env, execArgv = [], stdio } = options
        return fork(scriptPath, args, {
            cwd,
            env,
            execArgv,
            stdio,
        } as ForkOptions)
    }
}
