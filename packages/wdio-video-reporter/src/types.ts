import type { Reporters } from '@wdio/types'
import type { SUPPORTED_VIDEO_FORMATS } from './constants.js'

export type VideoFileExtension = keyof typeof SUPPORTED_VIDEO_FORMATS
export interface ReporterOptions extends Reporters.Options {
    /**
   * Folder for the videos (defaults to the WebdriverIO `outputDir` option, then `_results_`)
   */
    outputDir?: string

    /**
   * Path of the ffmpeg executable, or a command name on the `PATH`. Defaults to the
   * `FFMPEG_PATH` environment variable, then to `ffmpeg` on the `PATH`. WebdriverIO does
   * not install ffmpeg.
   */
    ffmpegPath?: string

    /**
   * Maximum time to wait for a video to finish rendering, and for one screenshot (in ms).
   * Set `reporterSyncTimeout` to a larger value when you increase it.
   * @default 5000
   */
    videoRenderTimeout?: number

    /**
   * Folder for the screenshots of the videos, in `outputDir` (or an absolute path).
   * The reporter does not remove them.
   * @default '.video-reporter-screenshots'
   */
    rawPath?: string

    /**
   * Start of the video file names: the title of the test (Cucumber: the scenario), or
   * the titles of the suites without the test
   * @default 'test'
   */
    filenamePrefixSource?: 'test' | 'suite'

    /**
   * Also save the videos of the tests that pass (else only of the tests that fail)
   * @default false
   */
    saveAllVideos?: boolean

    /**
   * How much slower the video plays (from 1 to 100, also with decimals)
   * @default 3
   */
    videoSlowdownMultiplier?: number

    /**
   * Video scale, see https://trac.ffmpeg.org/wiki/Scaling
   * @default '1200:trunc(ow/a/2)*2'
   */
    videoScale?: string

    /**
   * Longest file name of a video, without the extension (a longer name keeps its start
   * and its end)
   * @default 250
   */
    maxTestNameCharacters?: number

    /**
   * Format of the videos. Another value gives a warning and `webm`.
   * @default 'webm'
   */
    videoFormat?: 'webm' | 'mp4'

    /**
   * Commands that give no screenshot, with the names of `snapshotCommands`
   * (`recordAllActions` ignores it)
   * @default []
   */
    excludedActions?: string[],

    /**
   * Which commands should result in a screenshot: the last part of the WebDriver endpoint
   * (for example `click` for `/session/:sessionId/element/:elementId/click`)
   * @default ['url', 'back', 'forward', 'refresh', 'sync', 'maximize', 'minimize', 'fullscreen', 'rect', 'click', 'value', 'clear', 'accept', 'dismiss', 'actions', 'orientation']
   */
    snapshotCommands?: string[]

    /**
   * Take a screenshot after every command, also `GET` commands (slower tests)
   * @default false
   */
    recordAllActions?: boolean

    /**
   * Only record the last try of a spec file when `specFileRetries` is set
   * @default false
   */
    onlyRecordLastFailure?: boolean

    /**
   * Also take a screenshot at this interval while a test runs (in seconds, minimum 0.5)
   * @default 0
   */
    screenshotIntervalSecs?: number
}
