import http from 'node:http'
import { EventEmitter } from 'node:events'
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import type { AddressInfo } from 'node:net'
import { describe, it, expect } from 'vitest'

import { appiumServerArgs, startAppium, stopChild, waitForStatus } from '../../src/targets/appium.js'
import type { OpenPlan } from '../../src/types.js'

describe('appium server', () => {
    it('builds the server arguments', () => {
        expect(appiumServerArgs(4723, '/tmp/appium.log')).toEqual([
            '--port', '4723',
            '--base-path', '/',
            '--log', '/tmp/appium.log',
            '--log-no-colors'
        ])
    })

    it('waits until GET /status returns 200', async () => {
        const server = http.createServer((req, res) => {
            res.writeHead(req.url === '/status' ? 200 : 404)
            res.end('{}')
        })
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
        const port = (server.address() as AddressInfo).port
        await waitForStatus(port, 2000)
        await new Promise<void>((resolve) => server.close(() => resolve()))
    })

    it('sends SIGTERM and then SIGKILL when the child ignores it', async () => {
        const child = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); console.log('ready'); setInterval(() => {}, 1000)"], { stdio: ['ignore', 'pipe', 'ignore'] })
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('child did not start')), 2000)
            child.stdout?.on('data', (chunk) => {
                if (String(chunk).includes('ready')) {
                    clearTimeout(timer)
                    resolve()
                }
            })
            child.once('exit', (code) => {
                clearTimeout(timer)
                reject(new Error(`child exited before ready (${code})`))
            })
        })
        const started = Date.now()
        await stopChild(child, 300)
        /**
         * Windows has no POSIX signals: `kill('SIGTERM')` ends the process
         * immediately, so the grace period only elapses on other platforms.
         */
        if (process.platform !== 'win32') {
            expect(Date.now() - started).toBeGreaterThanOrEqual(250)
        }
        expect(child.signalCode === 'SIGKILL' || child.exitCode !== null || !child.pid).toBe(true)
    })

    it('rejects when the Appium process fails to spawn', async () => {
        const child = new EventEmitter() as ChildProcess
        child.exitCode = null
        child.signalCode = null
        child.kill = (() => {
            child.emit('exit', 1, null)
            return true
        }) as ChildProcess['kill']
        const plan = {
            cwd: '/tmp',
            artifactsDir: '/tmp',
            appium: { main: 'appium.js', port: 4723 }
        } as OpenPlan
        const pending = startAppium(plan, {
            spawn: (() => child) as unknown as typeof spawn,
            timeoutMs: 2000
        })
        child.emit('error', new Error('spawn ENOENT'))
        await expect(pending).rejects.toThrow(/ENOENT/)
    })
})
