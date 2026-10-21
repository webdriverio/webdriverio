import path from 'node:path'
import fs from 'node:fs'

import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'

import type { VideoFileExtension } from './types.js'
import { SUPPORTED_VIDEO_FORMATS, SCREENSHOT_PADDING_WITH } from './constants.js'

const log = logger('@wdio/video-reporter:helpers')

export function sleep(ms: number) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(1024)), 0, 0, ms)
}

export function generateFilename (maxTestNameCharacters: number, browserName: string, fullName: string) {
    const date = new Date()
    /**
     * ISO date and time (local time), the same on every machine: the community
     * versions used the locale of the machine
     */
    const pad2 = (value: number) => value.toString().padStart(2, '0')
    const timestamp = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}--` +
        `${pad2(date.getHours())}-${pad2(date.getMinutes())}-${pad2(date.getSeconds())}-` +
        date.getMilliseconds().toString().padStart(3, '0')

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
            .some(([filename, size]) => size !== updatedSizes[filename])
        if (!hasChanged) {
            return true
        }
        currentSizes = updatedSizes
    }

    log.debug('abortTime exceeded while waiting for videos to be written.\n')
    return false
}

/**
 * The browser that takes the screenshots: the first instance of a multi-remote
 * browser (its commands would run on all instances), else the browser itself
 */
export function getScreenshotBrowser (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser): WebdriverIO.Browser {
    if (browser.isMultiRemote) {
        const multiRemoteBrowser = browser as WebdriverIO.MultiRemoteBrowser
        return multiRemoteBrowser.getInstance(multiRemoteBrowser.instances[0])
    }
    return browser as WebdriverIO.Browser
}

export function getCurrentCapabilities (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
    const instance = getScreenshotBrowser(browser)
    const w3cCaps = instance.capabilities as Capabilities.W3CCapabilities
    const currentCapabilities: WebdriverIO.Capabilities = w3cCaps.alwaysMatch || instance.capabilities as WebdriverIO.Capabilities
    return currentCapabilities
}

/**
 * The device name: an Appium session returns its capabilities without the `appium:` prefix
 */
export function getDeviceName (capabilities: WebdriverIO.Capabilities) {
    const caps = capabilities as Record<string, unknown>
    const name = caps['appium:deviceName'] || caps.deviceName
    return typeof name === 'string' && name ? name : undefined
}

/**
 * A WebDriver BiDi command that the remote end does not have (for example Appium)
 */
export function isUnknownBidiCommand (error: unknown) {
    return /with error: unknown (command|method)\b/.test((error as Error)?.message ?? '')
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

type ReporterEntry = string | (new (...args: never[]) => unknown) | [string | (new (...args: never[]) => unknown), Record<string, unknown>?]

/**
 * Return the options of the Allure reporter in the `reporters` config (an empty
 * object if it has none), or `undefined` if Allure is not used. Allure can be set
 * by its name, its package name or its class.
 */
export function findAllureReporter (reporters?: unknown[]): Record<string, unknown> | undefined {
    const isAllure = (reporter: unknown) => reporter === 'allure' ||
        reporter === '@wdio/allure-reporter' ||
        // the build of @wdio/allure-reporter names the class `_AllureReporter`
        (typeof reporter === 'function' && /^_*AllureReporter$/.test(reporter.name))
    for (const entry of (reporters ?? []) as ReporterEntry[]) {
        if (Array.isArray(entry) && isAllure(entry[0])) {
            return entry[1] ?? {}
        }
        if (isAllure(entry)) {
            return {}
        }
    }
    return undefined
}

/**
 * The ffmpeg executable of the user: the `ffmpegPath` option, then the `FFMPEG_PATH`
 * environment variable (a path, or a command name on the `PATH`), then `ffmpeg` on
 * the `PATH`. WebdriverIO does not ship ffmpeg.
 * On Windows only `ffmpeg.exe`: Node.js starts `.cmd` and `.bat` files only with a shell.
 */
export function findFfmpeg (ffmpegPath?: string, env: NodeJS.ProcessEnv = process.env): string | undefined {
    const isExecutable = (file: string) => {
        try {
            if (!fs.statSync(file).isFile()) {
                return false
            }
            if (process.platform !== 'win32') {
                fs.accessSync(file, fs.constants.X_OK)
            }
            return true
        } catch {
            return false
        }
    }

    const onPath = (name: string) => (env.PATH ?? env.Path ?? '')
        .split(path.delimiter)
        .filter(Boolean)
        .map((dir) => path.join(dir, name))
        .find(isExecutable)

    const chosen = ffmpegPath || env.FFMPEG_PATH
    if (chosen) {
        if (isExecutable(chosen)) {
            return chosen
        }
        if (path.basename(chosen) !== chosen) {
            return undefined
        }
        // a command name with no folder (`FFMPEG_PATH=ffmpeg`) is looked up on the PATH,
        // on Windows with `.exe` when it has no extension
        return onPath(process.platform === 'win32' && !path.extname(chosen) ? `${chosen}.exe` : chosen)
    }

    return onPath(process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
}
