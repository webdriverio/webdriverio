export const SCREENSHOT_PADDING_WITH = 4

/**
 * characters of the ffmpeg output kept for the log of a failed render
 */
export const STDERR_TAIL_LENGTH = 2000
export const SUPPORTED_VIDEO_FORMATS = {
    mp4: {
        fileExtension: 'mp4',
        contentType: 'video/mp4',
        vcodec: 'libx264',
    },
    webm: {
        fileExtension: 'webm',
        contentType: 'video/webm',
        vcodec: 'libvpx-vp9',
    },
    default: {
        fileExtension: 'mp4',
        contentType: 'video/mp4',
        vcodec: 'libx264',
    }
} as const

export const DEFAULT_OPTIONS = {
    videoRenderTimeout: 5000,

    // Where to save screenshots
    rawPath: '.video-reporter-screenshots',

    // Prefix for video filenames by either suite or test name
    filenamePrefixSource: 'test',

    // Should all videos be saved, or only from failed tests
    saveAllVideos: false,

    // Video slowdown multiplier
    videoSlowdownMultiplier: 3,

    // Video scale, see https://trac.ffmpeg.org/wiki/Scaling
    videoScale: '1200:trunc(ow/a/2)*2',

    // Max chars for test names, adjust according to current system
    maxTestNameCharacters: 250,

    // videoFormat to be used for generated videos. One of 'mp4', 'webm'
    videoFormat: 'webm',

    // Which commands should be excluded from screenshots
    excludedActions: [],

    // Which commands should result in a screenshot (without `/session/:sessionId/`)
    // https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol
    /**
     * Last part of the WebDriver endpoints that change the page
     */
    snapshotCommands: [
        'url',
        'back',
        'forward',
        'refresh',
        'sync',
        'maximize',
        'minimize',
        'fullscreen',
        'rect',
        'click',
        'value',
        'clear',
        'accept',
        'dismiss',
        'actions',
        'orientation'
    ],

    // If test speed is not an issue, this option can be enabled to do a screenshot on every json wire message
    recordAllActions: false,

    // Should only the last failure be recorded
    onlyRecordLastFailure: false,

    // Add a screenshot at a regular interval
    screenshotIntervalSecs: 0,
} as const

