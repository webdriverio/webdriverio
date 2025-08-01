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
    ): ChildProcess;
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

    createWorkerProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions
    ): ChildProcess {
        const { cwd, env, execArgv = [], stdio } = options

        const shouldRun = this.#xvfbManager.shouldRun()
        const isAvailable = this.#isXvfbRunAvailable()

        this.#log.info(`ProcessFactory: shouldRun=${shouldRun}, isAvailable=${isAvailable}`)

        if (shouldRun && isAvailable) {
            this.#log.info('Creating worker process with xvfb-run wrapper')

            // Use spawn with xvfb-run wrapper
            const nodeArgs = [...execArgv, scriptPath, ...args]

            return spawn(
                'xvfb-run',
                ['--auto-servernum', '--', 'node', ...nodeArgs],
                {
                    cwd,
                    env,
                    stdio,
                } as SpawnOptions
            )
        }
        this.#log.info('Creating worker process with regular fork')

        // Use regular fork
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