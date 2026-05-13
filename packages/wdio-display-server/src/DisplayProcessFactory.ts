import { spawn, fork } from 'node:child_process'
import type { ChildProcess, SpawnOptions, ForkOptions } from 'node:child_process'
import logger from '@wdio/logger'
import { DisplayServerManager } from './DisplayServerManager.js'
import type { DisplayServer, ProcessCreator, ProcessCreationOptions } from './types.js'

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
     * Create process wrapped with display server.
     *
     * Wayland (Weston) does not exec its child — it spawns it as a subprocess,
     * so the IPC fd that Node.js creates on the directly-spawned process never
     * reaches the Node worker. We therefore start Weston as a short-lived
     * per-worker daemon and fork the Node worker directly, which keeps IPC
     * intact. xvfb-run does exec its child, so the spawn-wrapper path is fine
     * for Xvfb.
     */
    async #createDisplayServerProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions,
        displayServer: DisplayServer
    ): Promise<ChildProcess> {
        const { cwd, env, execArgv = [], stdio } = options

        if (displayServer.name === 'wayland') {
            const daemon = await displayServer.startDaemon()
            let childProcess: ChildProcess
            try {
                childProcess = fork(scriptPath, args, {
                    cwd,
                    env: { ...env, ...daemon.env },
                    execArgv,
                    stdio,
                } as ForkOptions)
            } catch (err) {
                await daemon.stop().catch(() => {})
                throw err
            }
            childProcess.once('exit', () => daemon.stop().catch(() => {}))
            return childProcess
        }

        // Xvfb: xvfb-run execs into its child so IPC fd is preserved
        return new Promise((resolve, reject) => {
            const nodeArgs = [...execArgv, scriptPath, ...args]

            const wrapper = displayServer.getProcessWrapper()
            if (!wrapper) {
                resolve(this.#createRegularProcess(scriptPath, args, options))
                return
            }

            // displayEnv is always {} for xvfb-run (it sets DISPLAY itself after exec'ing the child)
            const displayEnv = displayServer.getEnvironment()
            const mergedEnv = { ...env, ...displayEnv }

            const childProcess = spawn(
                wrapper[0],
                [...wrapper.slice(1), 'node', ...nodeArgs],
                { cwd, env: mergedEnv, stdio } as SpawnOptions
            )

            let resolved = false
            const fail = (err: Error) => {
                if (!resolved) { resolved = true; reject(err) }
            }

            childProcess.on('error', fail)
            childProcess.on('exit', (code, signal) => {
                if (!resolved && code !== 0) {
                    fail(new Error(`${displayServer.name} process exited with code ${code} and signal ${signal}`))
                }
            })
            setTimeout(() => { if (!resolved) { resolved = true; resolve(childProcess) } }, 2000)
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
