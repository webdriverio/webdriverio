import http from 'node:http'
import { spawn } from 'node:child_process'
import type { AddressInfo } from 'node:net'
import { describe, it, expect } from 'vitest'

import { appiumServerArgs, stopChild, waitForStatus } from '../../src/targets/appium.js'

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
        expect(Date.now() - started).toBeGreaterThanOrEqual(250)
        expect(child.signalCode === 'SIGKILL' || child.exitCode !== null || !child.pid).toBe(true)
    })
})
