import { spawn, fork, execSync } from 'node:child_process'
import type {
    ChildProcess,
    SpawnOptions,
    ForkOptions,
} from 'node:child_process'
import logger from '@wdio/logger'
import { XvfbManager } from './XvfbManager.js'

export interface ProcessCreator {
    createWorkerProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions
    ): Promise<ChildProcess>;
}

export interface ProcessCreationOptions {
    cwd?: string;
    env?: Record<string, string>;
    execArgv?: string[];
    stdio?: ('inherit' | 'pipe' | 'ignore' | 'ipc')[];
}

export class ProcessFactory implements ProcessCreator {
    #xvfbManager: XvfbManager
    #log = logger('@wdio/xvfb:ProcessFactory')

    constructor(xvfbManager?: XvfbManager) {
        this.#xvfbManager = xvfbManager || new XvfbManager()
    }

    async createWorkerProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions
    ): Promise<ChildProcess> {
        const shouldRun = this.#xvfbManager.shouldRun()
        const isAvailable = this.#isXvfbRunAvailable()

        this.#log.info(`ProcessFactory: shouldRun=${shouldRun}, isAvailable=${isAvailable}`)

        if (shouldRun && isAvailable) {
            this.#log.info('Creating worker process with xvfb-run wrapper and retry logic')

            return await this.#xvfbManager.executeWithRetry(
                () => this.#createXvfbProcess(scriptPath, args, options),
                'xvfb worker process creation'
            )
        }

        this.#log.info('Creating worker process with regular fork')
        return this.#createRegularProcess(scriptPath, args, options)
    }

    /**
     * Create process with xvfb-run wrapper
     */
    #createXvfbProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions
    ): Promise<ChildProcess> {
        return new Promise((resolve, reject) => {
            const { cwd, env, execArgv = [], stdio } = options
            const nodeArgs = [...execArgv, scriptPath, ...args]

            const childProcess = spawn(
                'xvfb-run',
                ['--auto-servernum', '--', 'node', ...nodeArgs],
                {
                    cwd,
                    env,
                    stdio: this.#reserveFd3(stdio),
                } as SpawnOptions
            )

            // Check for immediate startup failures
            let resolved = false
            const startupTimeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true
                    resolve(childProcess)
                }
            }, 100) // Short timeout to detect immediate failures

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
                    reject(new Error(`xvfb-run process exited with code ${code} and signal ${signal}`))
                }
            })
        })
    }

    /**
     * Keep fd 3 free for xvfb-run.
     *
     * xvfb-run claims fd 3 for its own logging and closes it before running the
     * command it wraps:
     *
     *     exec 3>&1                 # ...or 3>&2, or 3>>"$ERRORFILE"
     *     DISPLAY=:$N XAUTHORITY=$AUTHFILE "$@" 3>&-
     *
     * Node places the IPC channel at the first stdio slot after 0/1/2 — fd 3 — and
     * sets NODE_CHANNEL_FD to match. The worker therefore inherits a channel pointing
     * at a descriptor xvfb-run has already clobbered and closed, so process.send() is
     * a function but its first write fails with EINVAL and the worker dies before it
     * runs anything.
     *
     * Padding the array with one 'ignore' ahead of the ipc slot moves the channel to
     * fd 4, which xvfb-run does not touch; NODE_CHANNEL_FD follows the slot, so
     * nothing else has to change. A stdio array with no ipc slot is left alone.
     */
    #reserveFd3(
        stdio: ProcessCreationOptions['stdio']
    ): ProcessCreationOptions['stdio'] {
        if (!stdio || !stdio.includes('ipc')) {
            return stdio
        }

        return [...stdio.slice(0, 3), 'ignore', ...stdio.slice(3)]
    }

    /**
     * Create regular process without xvfb
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

    /**
     * Check if xvfb-run is actually available on the system
     */
    #isXvfbRunAvailable(): boolean {
        try {
            execSync('which xvfb-run', { stdio: 'ignore' })
            this.#log.info('xvfb-run found in PATH')
            return true
        } catch {
            this.#log.info('xvfb-run not found, falling back to regular fork')
            return false
        }
    }
}
