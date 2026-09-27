import http from 'node:http'
import net from 'node:net'
import { spawn, type ChildProcess } from 'node:child_process'
import type { AddressInfo } from 'node:net'

import logger from '@wdio/logger'

import type { OpenPlan } from '../types.js'
import { SessionError } from '../errors.js'

const log = logger('@wdio/session:appium')

export function appiumServerArgs (port: number, logFile: string) {
    return ['--port', String(port), '--base-path', '/', '--log', logFile, '--log-no-colors']
}

export function freePort (): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer()
        server.once('error', reject)
        server.listen(0, '127.0.0.1', () => {
            const address = server.address() as AddressInfo | null
            if (!address || typeof address === 'string') {
                server.close()
                reject(new Error('Could not allocate a port'))
                return
            }
            server.close(() => resolve(address.port))
        })
    })
}

export function waitForStatus (port: number, timeoutMs = 60_000): Promise<void> {
    const started = Date.now()
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const req = http.get({ hostname: '127.0.0.1', port, path: '/status', timeout: 1000 }, (res) => {
                res.resume()
                if (res.statusCode === 200) {
                    resolve()
                    return
                }
                retry()
            })
            req.on('error', retry)
            req.on('timeout', () => {
                req.destroy()
                retry()
            })
        }
        const retry = () => {
            if (Date.now() - started > timeoutMs) {
                reject(new SessionError('SESSION_START_FAILED', `Appium did not answer on port ${port} within ${timeoutMs}ms.`))
                return
            }
            setTimeout(attempt, 200)
        }
        attempt()
    })
}

export function stopChild (child: ChildProcess, killAfterMs = 5000) {
    return new Promise<void>((resolve) => {
        if (child.exitCode !== null || child.signalCode !== null) {
            resolve()
            return
        }
        const timer = setTimeout(() => {
            try {
                child.kill('SIGKILL')
            } catch {
                // already gone
            }
        }, killAfterMs)
        child.once('exit', () => {
            clearTimeout(timer)
            resolve()
        })
        try {
            child.kill('SIGTERM')
        } catch {
            clearTimeout(timer)
            resolve()
        }
    })
}

/**
 * Start a local Appium server and wait until `GET /status` returns 200.
 */
export async function startAppium (plan: OpenPlan, opts: { spawn?: typeof spawn, timeoutMs?: number } = {}) {
    const main = plan.appium?.main
    const port = plan.appium?.port
    if (!main || !port) {
        throw new SessionError('SESSION_START_FAILED', 'No Appium server was planned for this session.')
    }
    const logFile = `${plan.artifactsDir}/appium.log`
    const launch = opts.spawn || spawn
    const child = launch(process.execPath, [main, ...appiumServerArgs(port, logFile)], {
        cwd: plan.cwd,
        stdio: 'ignore',
        windowsHide: true
    })
    try {
        await waitForStatus(port, opts.timeoutMs)
    } catch (err) {
        await stopChild(child, 1000)
        throw err
    }
    log.info(`Appium listening on port ${port}`)
    return {
        pid: child.pid ?? -1,
        stop: () => stopChild(child)
    }
}
