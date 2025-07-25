import { spawn, fork } from 'node:child_process'
import type { ChildProcess, SpawnOptions, ForkOptions } from 'node:child_process'
import type { XvfbManager } from '@wdio/xvfb'
import logger from '@wdio/logger'

const log = logger('@wdio/local-runner:ProcessFactory')

export interface ProcessCreator {
    createWorkerProcess(scriptPath: string, args: string[], options: ProcessCreationOptions): ChildProcess
}

export interface ProcessCreationOptions {
    cwd?: string
    env?: Record<string, string>
    execArgv?: string[]
    stdio?: ('inherit' | 'pipe' | 'ignore' | 'ipc')[]
}

export class ProcessFactory implements ProcessCreator {
    constructor(private xvfbManager: XvfbManager) {}

    createWorkerProcess(scriptPath: string, args: string[], options: ProcessCreationOptions): ChildProcess {
        const { cwd, env, execArgv = [], stdio } = options

        if (this.xvfbManager.shouldRun()) {
            log.debug('Creating worker process with xvfb-run wrapper')

            // Use spawn with xvfb-run wrapper
            const nodeArgs = [...execArgv, scriptPath, ...args]

            return spawn('xvfb-run', [
                '--auto-servernum',
                '--',
                'node',
                ...nodeArgs
            ], {
                cwd,
                env,
                stdio
            } as SpawnOptions)
        }
        log.debug('Creating worker process with regular fork')

        // Use regular fork
        return fork(scriptPath, args, {
            cwd,
            env,
            execArgv,
            stdio
        } as ForkOptions)

    }
}