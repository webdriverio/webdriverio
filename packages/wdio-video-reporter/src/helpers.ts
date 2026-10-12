import path from 'node:path'
import fs from 'node:fs'

import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'

import type { VideoFileExtension } from './types.js'
import { SUPPORTED_VIDEO_FORMATS, SCREENSHOT_PADDING_WITH, TO_LOCAL_STRING_OPTIONS } from './constants.js'

const log = logger('@wdio/video-reporter:helpers')

export function sleep(ms: number) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(1024)), 0, 0, ms)
}

export function generateFilename (maxTestNameCharacters: number, browserName: string, fullName: string) {
    const date = new Date()
    const msec = ('000' + date.getMilliseconds()).slice(-3)
    const timestamp = date.toLocaleString('iso', TO_LOCAL_STRING_OPTIONS)
        .replace(/[ ]/g, '--')
        .replace(/:|\//g, '-') + `-${msec}`

    const wdioWorkerText = process.env.WDIO_WORKER_ID ? `${process.env.WDIO_WORKER_ID}-` : ''
    let filename = encodeURIComponent(`${fullName.replace(/\s+/g, '-')}-${wdioWorkerText}-${browserName}--${timestamp}`)
        .replace(/%../g, '')
        .replace(/\./g, '-')
        .replace(/[/\\?%*:'|"<>()]/g, '')

    if (filename.length > maxTestNameCharacters) {
        const truncLength = (maxTestNameCharacters - 2)/2
        filename = filename.slice(0, truncLength) + '--' + filename.slice(-truncLength)
    }

    return filename
}

export function getVideoPath (outputDir: string, testName: string, ext: VideoFileExtension) {
    return path.resolve(outputDir, `${testName}.${ext}`)
}

export function getVideoFormatSettings (videoFormat: VideoFileExtension) {
    return SUPPORTED_VIDEO_FORMATS[videoFormat]
}

/**
 * wait for videos to be generated
 * @param videos     path to generated videos
 * @param abortTime  timeout in ms
 * @param sleepFn    sleep function (for testing purposes)
 */
export function waitForVideosToExist (videos: string[], abortTime: number, sleepFn = sleep) {
    const waitTime = 100
    const allExist = videos
        .map(v => fs.existsSync(v))
        .every(Boolean)

    let allGenerated = false
    if (allExist) {
        allGenerated = videos
            .map(v => fs.statSync(v).size)
            .reduce((acc, cur) => acc && cur > 48, true)
    }

    if (allGenerated) {
        return true
    }

    if (abortTime <= 0 && (!allExist || !allGenerated)) {
        log.debug('abortTime exceeded while waiting for videos to exist.\n')
        return false
    }

    sleepFn(waitTime)
    return waitForVideosToExist(videos, abortTime - waitTime, sleepFn)
}

/**
 * Wait for videos to be written, i.e. their size is not changing anymore
 * @param videos    path to generated videos
 * @param abortTime timeout in ms
 * @param sleepFn   sleep function (for testing purposes)
 */
export function waitForVideosToBeWritten (videos: string[], abortTime: number, sleepFn = sleep) {
    const start = Date.now()
    let currentSizes = videos.reduce((fileMap, filename) => {
        fileMap[filename] = fs.statSync(filename).size
        return fileMap
    }, {} as Record<string, number>)

    while ((Date.now() - start) <= abortTime) {
        sleepFn(100)
        const updatedSizes = videos.reduce((fileMap, filename) => {
            fileMap[filename] = fs.statSync(filename).size
            return fileMap
        }, {} as Record<string, number>)
        const hasChanged = Object.entries(currentSizes)
            .every(([filename, size]) => size !== updatedSizes[filename])
        if (!hasChanged) {
            return true
        }
        currentSizes = updatedSizes
    }

    log.debug('abortTime exceeded while waiting for videos to be written.\n')
    return false
}

export function getCurrentCapabilities (browser: WebdriverIO.Browser) {
    const mrCaps = browser.capabilities as Capabilities.RequestedMultiRemoteCapabilities
    const w3cCaps = browser.capabilities as Capabilities.W3CCapabilities
    const currentCapabilities: WebdriverIO.Capabilities = browser.isMultiRemote
        ? mrCaps[Object.keys(browser.capabilities)[0]].capabilities as WebdriverIO.Capabilities
        : w3cCaps.alwaysMatch || browser.capabilities as WebdriverIO.Capabilities
    return currentCapabilities
}

export function pad (frameNumber: number) {
    return frameNumber.toString().padStart(SCREENSHOT_PADDING_WITH, '0')
}

/**
 * WebDriver BiDi commands that change the page, and the name of the classic
 * command they replace (the name used in `snapshotCommands`). `script.callFunction`
 * is not in the list: WebdriverIO uses it inside many commands of a BiDi session.
 */
const BIDI_SNAPSHOT_COMMANDS: Record<string, string> = {
    'browsingContext.navigate': 'url',
    'browsingContext.reload': 'refresh',
    'input.performActions': 'actions'
}

/**
 * Return the snapshot command name of a WebDriver BiDi command, or `undefined` if
 * the command does not change the page
 */
export function getBidiSnapshotCommand (command: { method?: string, params?: unknown }): string | undefined {
    if (command.method === 'browsingContext.traverseHistory') {
        const delta = (command.params as { delta?: number } | undefined)?.delta ?? 0
        return delta < 0 ? 'back' : 'forward'
    }
    return command.method ? BIDI_SNAPSHOT_COMMANDS[command.method] : undefined
}

/**
 * Resolve when the promise ends, or after `ms` milliseconds
 * @returns `true` if the promise ended in time
 */
export function endsInTime (promise: Promise<unknown>, ms: number): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined
    const timeout = new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), ms)
    })
    return Promise.race([promise.then(() => true, () => true), timeout]).finally(() => clearTimeout(timer))
}
