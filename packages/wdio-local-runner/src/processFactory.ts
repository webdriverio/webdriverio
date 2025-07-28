import { spawn, fork, execSync } from 'node:child_process'
import type {
    ChildProcess,
    SpawnOptions,
    ForkOptions,
} from 'node:child_process'
import { xvfb } from '@wdio/xvfb'
import logger from '@wdio/logger'

const log = logger('@wdio/local-runner:ProcessFactory')

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
    #xvfbManager = xvfb

    createWorkerProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions
    ): ChildProcess {
        const { cwd, env, execArgv = [], stdio } = options

        const shouldRun = this.#xvfbManager.shouldRun()
        const isAvailable = this.#isXvfbRunAvailable()

        log.info(`ProcessFactory: shouldRun=${shouldRun}, isAvailable=${isAvailable}`)

        if (shouldRun && isAvailable) {
            log.info('Creating worker process with xvfb-run wrapper')

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
        log.info('Creating worker process with regular fork')

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
            log.info('xvfb-run found in PATH')
            return true
        } catch {
            log.info('xvfb-run not found, falling back to regular fork')
            return false
        }
    }
}
