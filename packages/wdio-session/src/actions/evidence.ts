import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import logger from '@wdio/logger'

import { usage } from '../errors.js'
import { takeSnapshot } from './observe.js'
import type { ActionArgs } from './index.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'

const log = logger('@wdio/session:evidence')

interface TraceStep {
    id: number
    action: string
    time: string
    code?: string
    text?: string
    error?: string
}

interface Tracer {
    dir: string
    screenshots: boolean
    snapshots: boolean
    steps: TraceStep[]
    pending?: { id: number, action: string, time: string, args: Record<string, unknown> }
}

interface Recorder {
    mode: 'screencast' | 'frames' | 'appium'
    dir: string
    fps: number
    frames: string[]
    screencast?: string
    file?: string
    timer?: NodeJS.Timeout
    capturing?: boolean
    pending?: Promise<void>
}

const SKIP = new Set(['trace', 'record'])

function publicArgs (args: ActionArgs) {
    return Object.fromEntries(Object.entries(args).filter(([key]) => !key.startsWith('$')))
}

function restrict (file: string, mode: number) {
    if (process.platform !== 'win32') {
        fs.chmodSync(file, mode)
    }
}

function appendLine (file: string, value: unknown) {
    fs.appendFileSync(file, JSON.stringify(value) + '\n', { mode: 0o600 })
    restrict(file, 0o600)
}

function writeTranscript (tracer: Tracer) {
    const parts = ['# Trace', '']
    for (const step of tracer.steps) {
        parts.push(`## Step ${step.id} — ${step.action}`, '', step.time, '')
        if (step.code) {
            parts.push('```js', step.code, '```', '')
        }
        if (step.text) {
            parts.push(step.text, '')
        }
        if (step.error) {
            parts.push(`Error: ${step.error}`, '')
        }
        if (tracer.screenshots) {
            parts.push(`![step ${step.id}](resources/step-${step.id}.png)`, '')
        }
        if (tracer.snapshots) {
            parts.push(`[snapshot](resources/step-${step.id}-snapshot.txt)`, '')
        }
    }
    const transcript = path.join(tracer.dir, 'transcript.md')
    fs.writeFileSync(transcript, parts.join('\n'), { mode: 0o600 })
    restrict(transcript, 0o600)
}

async function captureFrame (session: Session, file: string) {
    const image = await session.browser.takeScreenshot()
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
    restrict(path.dirname(file), 0o700)
    fs.writeFileSync(file, Buffer.from(image, 'base64'), { mode: 0o600 })
    restrict(file, 0o600)
}

function installProbe (session: Session) {
    if (session.get('evidenceProbe')) {
        return
    }
    session.set('evidenceProbe', true)
    session.set('trace', {
        before: async (action: string, args: ActionArgs) => {
            const tracer = session.get<Tracer>('tracer')
            if (!tracer || SKIP.has(action)) {
                return
            }
            const id = tracer.steps.length + 1
            const time = new Date().toISOString()
            tracer.pending = { id, action, time, args: publicArgs(args) }
            appendLine(path.join(tracer.dir, 'trace.trace'), { type: 'before', stepId: id, time, action, args: tracer.pending.args })
        },
        after: async (action: string, args: ActionArgs, result?: ActionOutcome, error?: { message: string }) => {
            const tracer = session.get<Tracer>('tracer')
            if (tracer && !SKIP.has(action) && tracer.pending) {
                const pending = tracer.pending
                tracer.pending = undefined
                const step: TraceStep = {
                    id: pending.id,
                    action,
                    time: pending.time,
                    code: result?.history,
                    text: result?.text,
                    error: error?.message
                }
                const resources = path.join(tracer.dir, 'resources')
                fs.mkdirSync(resources, { recursive: true })
                if (tracer.screenshots) {
                    await captureFrame(session, path.join(resources, `step-${step.id}.png`)).catch((err) => {
                        step.error = step.error || `screenshot failed: ${(err as Error).message}`
                    })
                }
                if (tracer.snapshots && session.isWeb) {
                    const snap = await takeSnapshot(session).catch((err) => ({ text: `snapshot failed: ${(err as Error).message}` }))
                    fs.writeFileSync(path.join(resources, `step-${step.id}-snapshot.txt`), snap.text + '\n')
                }
                tracer.steps.push(step)
                writeTranscript(tracer)
                appendLine(path.join(tracer.dir, 'trace.trace'), {
                    type: 'after',
                    stepId: step.id,
                    time: new Date().toISOString(),
                    action,
                    args: publicArgs(args),
                    code: step.code,
                    ...(step.error ? { error: step.error } : {})
                })
            }
            const recorder = session.get<Recorder>('recorder')
            if (recorder?.mode === 'frames' && !recorder.timer && !SKIP.has(action)) {
                await takeRecordingFrame(session, recorder)
            }
        }
    })
}

async function saveRecordingFrame (session: Session, recorder: Recorder) {
    const name = String(recorder.frames.length + 1).padStart(4, '0') + '.png'
    const file = path.join(recorder.dir, 'frames', name)
    await captureFrame(session, file)
    recorder.frames.push(file)
}

/** One frame at a time. The timer, the first frame, and stop share this. */
function takeRecordingFrame (session: Session, recorder: Recorder) {
    if (recorder.capturing) {
        return recorder.pending
    }
    recorder.capturing = true
    recorder.pending = saveRecordingFrame(session, recorder)
        .catch((err) => log.warn(`Frame capture failed: ${(err as Error).message}`))
        .finally(() => {
            recorder.capturing = false
        })
    return recorder.pending
}

function command (bin: string, args: string[]) {
    return new Promise<void>((resolve, reject) => {
        execFile(bin, args, (err, _stdout, stderr) => err ? reject(new Error(`${(err as Error).message}\n${stderr}`)) : resolve())
    })
}

function binExists (name: string) {
    const paths = (process.env.PATH || '').split(path.delimiter)
    return paths.some((dir) => fs.existsSync(path.join(dir, name)))
}

async function startScreencast (session: Session, dir: string) {
    const browser = session.browser as WebdriverIO.Browser & {
        browsingContextStartScreencast?: (params: { context: string, destinationFolder?: string }) => Promise<{ screencast?: string, path?: string }>
    }
    if (!session.isBidi || typeof browser.browsingContextStartScreencast !== 'function') {
        return undefined
    }
    try {
        const context = await session.browser.getWindowHandle()
        const started = await browser.browsingContextStartScreencast({ context, destinationFolder: dir })
        if (!started?.path && !started?.screencast) {
            return undefined
        }
        return started
    } catch (err) {
        log.info(`BiDi screencast is not available: ${(err as Error).message}`)
        return undefined
    }
}

export const trace: ActionFn = async (session, args) => {
    const sub = String(args.sub || '')
    if (sub === 'start') {
        if (session.get('tracer')) {
            throw usage('A trace is already running.', `Stop it with \`${session.cmd('trace', { sub: 'stop' }, 'wdio session trace stop')}\`.`)
        }
        installProbe(session)
        const dir = session.artifact('trace', session.timestamp())
        fs.mkdirSync(path.join(dir, 'resources'), { recursive: true, mode: 0o700 })
        restrict(dir, 0o700)
        restrict(path.join(dir, 'resources'), 0o700)
        const tracer: Tracer = {
            dir,
            screenshots: args.screenshots !== false,
            snapshots: args.snapshots !== false,
            steps: []
        }
        fs.writeFileSync(path.join(dir, 'trace.trace'), '', { mode: 0o600 })
        restrict(path.join(dir, 'trace.trace'), 0o600)
        session.set('tracer', tracer)
        return { text: `Tracing to ${dir}` }
    }
    if (sub === 'stop') {
        const tracer = session.get<Tracer>('tracer')
        if (!tracer) {
            throw usage('No trace is running.')
        }
        writeTranscript(tracer)
        session.set('tracer', undefined)
        const transcript = path.join(tracer.dir, 'transcript.md')
        return { text: `Trace ${tracer.dir}\n${transcript}`, data: { dir: tracer.dir, transcript, steps: tracer.steps.length } }
    }
    throw usage('trace needs start or stop.')
}

/**
 * Appium 3 records through driver execute methods. `saveRecordingScreen`
 * stops that recording and writes the file.
 */
function mobileRecordingStart (session: Session, fps: number) {
    const target = String(session.plan?.target || (session.browser.capabilities as { platformName?: string })?.platformName || '').toLowerCase()
    if (target === 'ios') {
        return { script: 'mobile: startXCTestScreenRecording', args: { videoFps: fps } }
    }
    if (target === 'android') {
        return { script: 'mobile: startMediaProjectionRecording', args: {} }
    }
    return undefined
}

export const record: ActionFn = async (session, args) => {
    const sub = String(args.sub || '')
    if (sub === 'start') {
        if (session.get('recorder')) {
            throw usage('A recording is already running.', `Stop it with \`${session.cmd('record', { sub: 'stop' }, 'wdio session record stop')}\`.`)
        }
        installProbe(session)
        const fps = typeof args.fps === 'number' && args.fps > 0 ? args.fps : 5
        const dir = session.artifact('record', session.timestamp())
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
        restrict(dir, 0o700)
        const mobile = session.applies.includes('M') ? mobileRecordingStart(session, fps) : undefined
        if (mobile) {
            await session.browser.executeScript(mobile.script, [mobile.args])
            const recorder: Recorder = { mode: 'appium', dir, fps, frames: [] }
            session.set('recorder', recorder)
            return { text: `Recording the device screen to ${dir}` }
        }
        const screencast = await startScreencast(session, dir)
        const recorder: Recorder = screencast
            ? { mode: 'screencast', dir, fps, frames: [], screencast: screencast.screencast, file: screencast.path }
            : { mode: 'frames', dir, fps, frames: [] }
        session.set('recorder', recorder)
        if (recorder.mode === 'frames') {
            const interval = Math.max(100, Math.round(1000 / fps))
            recorder.timer = setInterval(() => {
                takeRecordingFrame(session, recorder)
            }, interval)
            await takeRecordingFrame(session, recorder)
        }
        return { text: recorder.mode === 'screencast' ? `Recording screencast to ${recorder.file || dir}` : `Recording frames to ${path.join(dir, 'frames')} at ${fps} fps` }
    }
    if (sub === 'stop') {
        const recorder = session.get<Recorder>('recorder')
        if (!recorder) {
            throw usage('No recording is running.')
        }
        if (recorder.timer) {
            clearInterval(recorder.timer)
            recorder.timer = undefined
        }
        if (recorder.mode === 'appium') {
            const file = path.join(recorder.dir, 'recording.mp4')
            await session.browser.saveRecordingScreen(file)
            restrict(file, 0o600)
            session.set('recorder', undefined)
            return { text: `Recorded ${file}`, files: [file], data: { file, mode: 'appium' } }
        }
        if (recorder.mode === 'screencast') {
            const browser = session.browser as WebdriverIO.Browser & {
                browsingContextStopScreencast?: (params: { screencast: string }) => Promise<unknown>
            }
            if (recorder.screencast && browser.browsingContextStopScreencast) {
                await browser.browsingContextStopScreencast({ screencast: recorder.screencast }).catch((err) => {
                    log.warn(`Stopping the screencast failed: ${(err as Error).message}`)
                })
            }
            session.set('recorder', undefined)
            const file = recorder.file && fs.existsSync(recorder.file) ? recorder.file : recorder.dir
            return { text: `Recorded ${file}`, files: [file], data: { file, mode: 'screencast' } }
        }
        await recorder.pending
        await takeRecordingFrame(session, recorder)
        const out = path.resolve(session.cwd, typeof args.path === 'string' && args.path
            ? args.path
            : path.join(recorder.dir, 'recording.mp4'))
        let note = ''
        if (binExists('ffmpeg') && recorder.frames.length) {
            fs.mkdirSync(path.dirname(out), { recursive: true })
            await command('ffmpeg', ['-y', '-framerate', String(recorder.fps), '-i', path.join(recorder.dir, 'frames', '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out])
        } else {
            note = '\nffmpeg is not installed, so no video was encoded.'
        }
        session.set('recorder', undefined)
        const video = fs.existsSync(out) ? out : recorder.frames.at(-1) || recorder.dir
        return {
            text: `Recorded ${video}\n${recorder.frames.length} frames in ${path.join(recorder.dir, 'frames')}${note}`,
            files: [video],
            data: { file: video, frames: recorder.frames.length, mode: 'frames' }
        }
    }
    throw usage('record needs start or stop.')
}
