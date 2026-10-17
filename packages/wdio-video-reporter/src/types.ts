import type { Reporters } from '@wdio/types'
import type { SUPPORTED_VIDEO_FORMATS } from './constants.js'

export type VideoFileExtension = keyof typeof SUPPORTED_VIDEO_FORMATS
export interface ReporterOptions extends Reporters.Options {
    /**
   * Path to store the videos (defaults to the WebdriverIO `outputDir` option)
   */
    outputDir?: string

    /**
   * Path of the ffmpeg executable. Defaults to the `FFMPEG_PATH` environment variable,
   * then to `ffmpeg` on the `PATH`. WebdriverIO does not install ffmpeg.
   */
    ffmpegPath?: string

    /**
   * Maximum time to wait for a video to finish rendering (in ms).
   * @default 5000
   */
    videoRenderTimeout?: number

    /**
   * Where to save screenshots
   * @default '.video-reporter-screenshots'
   */
    rawPath?: string

    /**
   * Prefix for video filenames by either suite or test name
   * @default 'test'
   */
    filenamePrefixSource?: 'test' | 'suite'

    /**
   * Should all videos be saved, or only from failed tests
   * @default false
   */
    saveAllVideos?: boolean

    /**
   * @default 3
   */
    videoSlowdownMultiplier?: number

    /**
   * Video scale, see https://trac.ffmpeg.org/wiki/Scaling
   * @default '1200:trunc(ow/a/2)*2'
   */
    videoScale?: string

    /**
   * Max chars for test names, adjust according to current system
   * @default 250
   */
    maxTestNameCharacters?: number

    /**
   * videoFormat to be used for generated videos. One of 'mp4', 'webm'
   * @default 'webm'
   */
    videoFormat?: keyof typeof SUPPORTED_VIDEO_FORMATS

    /**
   * Which commands should be excluded from screenshots
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
   * If test speed is not an issue, this option can be enabled to do a screenshot on every json wire message
   * @default false
   */
    recordAllActions?: boolean

    /**
   * Only record the last try of a spec file when `specFileRetries` is set
   * @default false
   */
    onlyRecordLastFailure?: boolean

    /**
   * Add a screenshot at a regular interval (in seconds)
   */
    screenshotIntervalSecs?: number
}
