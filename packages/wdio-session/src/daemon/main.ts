import crypto from 'node:crypto'

import logger from '@wdio/logger'

import { SessionError } from '../errors.js'
import { Session } from '../session.js'
import { SessionServer } from './server.js'
import { getSocketPath, readState, removeState, updateState, writeState } from './state.js'
import { startWatchdog } from './watchdog.js'
import { launch, SESSION_LOG_LEVELS, type Launched } from '../targets/launch.js'
import { initSession } from './init.js'
import type { OpenPlan } from '../types.js'

const log = logger('@wdio/session:daemon')

function decodePlan (): OpenPlan {
    const encoded = process.env.WDIO_SESSION_OPEN
    if (!encoded) {
        throw new Error('WDIO_SESSION_OPEN is not set, the daemon must be started by `wdio session open`')
    }
    delete process.env.WDIO_SESSION_OPEN
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'))
}

async function main () {
    const plan = decodePlan()
    logger.setLogLevelsConfig(SESSION_LOG_LEVELS, plan.remote.logLevel as 'warn')
    process.title = `wdio-session ${plan.name}`
    log.info(`Starting session "${plan.name}" for ${plan.label}`)

    const socketPath = getSocketPath(plan.runtimeDir, plan.name)
    const token = crypto.randomBytes(32).toString('hex')
    let launched: Launched | undefined
    let server: SessionServer | undefined
    let session: Session | undefined
    let shuttingDown = false

    const shutdown = async (reason: 'close' | 'died' | 'idle' | 'signal' | 'resume', err?: SessionError) => {
        if (shuttingDown) {
            return
        }
        shuttingDown = true
        log.info(`Shutting down (${reason})`)
        const hardExit = setTimeout(() => process.exit(0), 20_000)
        hardExit.unref()
        await server?.close(err || new SessionError('SESSION_DIED', `The session was shut down (${reason}).`)).catch(() => {})
        if (session) {
            await session.dispose().catch((e) => log.warn(`Dispose failed: ${e.message}`))
        }
        await launched?.cleanup(reason === 'died').catch((e) => log.warn(`Cleanup failed: ${e.message}`))
        removeState(plan.runtimeDir, plan.name)
        if (reason === 'died' && process.platform !== 'win32') {
            /**
             * the daemon leads its process group (spawned detached); take
             * the remains of a crashed browser or driver down with it
             */
            process.kill(-process.pid, 'SIGKILL')
        }
        process.exit(0)
    }

    for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP'] as const) {
        process.on(signal, () => shutdown('signal'))
    }

    try {
        launched = await launch(plan)
        session = new Session({
            name: plan.name,
            cwd: plan.cwd,
            artifactsDir: plan.artifactsDir,
            runtimeDir: plan.runtimeDir,
            browser: launched.browser,
            plan,
            keepHistory: plan.keepHistory
        })
        session.onShutdown = (reason, e) => shutdown(reason, e)
        await initSession(session)

        let lastWrite = 0
        server = new SessionServer({
            socketPath,
            token,
            handler: (req) => session!.dispatch(req),
            idleTimeout: plan.idleTimeout,
            onIdle: () => shutdown('idle'),
            onRequest: () => {
                const now = Date.now()
                if (now - lastWrite > 1000) {
                    lastWrite = now
                    updateState(plan.runtimeDir, plan.name, { lastRequestAt: new Date(now).toISOString() })
                }
            }
        })
        await server.listen()
        session.server = server
        startWatchdog(session, launched, server, () => shutdown('died', new SessionError('SESSION_DIED', `The ${plan.label} session went away.`)))

        const caps = launched.browser.capabilities as WebdriverIO.Capabilities
        const state = readState(plan.runtimeDir, plan.name)
        writeState(plan.runtimeDir, {
            ...(state || { version: 1, name: plan.name, cwd: plan.cwd, artifactsDir: plan.artifactsDir, startedAt: new Date().toISOString() }),
            pid: process.pid,
            status: 'ready',
            socket: socketPath,
            token,
            target: plan.target,
            label: plan.label,
            platform: plan.platform,
            browserName: caps.browserName || (caps as Record<string, string>).platformName,
            browserVersion: caps.browserVersion || (caps as Record<string, string>)['appium:platformVersion'],
            sessionId: launched.browser.sessionId,
            bidi: session.isBidi,
            url: await session.currentUrl(),
            lastRequestAt: new Date().toISOString()
        })
        log.info(`Session "${plan.name}" ready (${launched.browser.sessionId})`)
    } catch (err) {
        const error = SessionError.from(err, 'SESSION_START_FAILED')
        if (error.code === 'INTERNAL') {
            error.code = 'SESSION_START_FAILED'
        }
        log.error(`Failed to start session: ${(err as Error)?.stack || err}`)
        updateState(plan.runtimeDir, plan.name, { status: 'failed', pid: process.pid, error: error.toJSON() })
        await session?.dispose().catch(() => {})
        await launched?.cleanup(true).catch(() => {})
        process.exit(1)
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
