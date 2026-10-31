/**
 * The frames of one test (with Cucumber step reporting: one scenario). Outside
 * parallel mode the reporter has one recording at a time; in parallel mode each
 * test window (browsing context) has its own.
 */
export class Recording {
    testName?: string
    path?: string
    frameNr = 0
    screenshots: Promise<void>[] = []
    /**
     * the tab or frame (iframe) of the last frame, when it is not the window of the test
     */
    frameContext?: string
    /**
     * the screenshot of the last frame, for a frame whose session ended first
     */
    lastScreenshot: Promise<string | undefined> = Promise.resolve(undefined)
    /**
     * the screenshot of the last frame, until the next command of this test starts
     */
    pendingFrame?: Promise<unknown>
    interval?: NodeJS.Timeout
    /**
     * the title of the test that started and did not end yet
     */
    openTestTitle?: string

    /**
     * @param window  parallel mode: the browsing context of the test (its window);
     *                outside parallel mode the main window of the session
     */
    constructor (public window?: string) {}
}
