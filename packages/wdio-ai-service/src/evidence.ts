import fs from 'node:fs/promises'
import path from 'node:path'

import logger from '@wdio/logger'

const log = logger('@wdio/ai-service')

/**
 * Whether heals are captured: `healEvidence` is on and the workspace
 * retention keeps evidence at all. `workspace.keep: 'never'` keeps no
 * screenshots or videos either.
 */
export function capturesHealEvidence (options: { healEvidence?: boolean, workspace?: { keep?: 'on-failure' | 'always' | 'never' } }) {
    return options.healEvidence !== false && options.workspace?.keep !== 'never'
}

/**
 * What a replay calls when a cached step fails and while it is healed.
 */
export interface HealHooks {
    /**
     * the step failed, healing starts
     */
    begin (): Promise<void>
    /**
     * a step of the heal ran
     */
    after (): Promise<void>
}

/**
 * Screenshots of a heal: the page when the cached step failed and after
 * every step that healed it. A browser that records a screencast over
 * WebDriver BiDi also saves a video of the heal. Nothing is captured
 * while cached steps replay fine.
 */
export class HealEvidence implements HealHooks {
    readonly dir: string
    #browser: WebdriverIO.Browser
    #files: string[] = []
    #screencast?: string
    #begun = false
    #steps = 0

    constructor (browser: WebdriverIO.Browser, dir: string) {
        this.#browser = browser
        this.dir = dir
    }

    get begun () {
        return this.#begun
    }

    async begin () {
        if (this.#begun) {
            return
        }
        this.#begun = true
        await fs.mkdir(this.dir, { recursive: true })
        await this.#screenshot('failed')
        this.#screencast = await startScreencast(this.#browser, this.dir)
    }

    async after () {
        if (this.#begun) {
            await this.#screenshot(`step-${++this.#steps}`)
        }
    }

    /**
     * stop the screencast, the files of the heal
     */
    async end (): Promise<string[]> {
        if (!this.#begun) {
            return []
        }
        if (this.#screencast) {
            const video = await stopScreencast(this.#browser, this.#screencast)
            this.#screencast = undefined
            if (video) {
                this.#files.push(video)
            }
        }
        return [...this.#files]
    }

    async #screenshot (name: string) {
        const file = path.join(this.dir, `${name}.png`)
        try {
            await this.#browser.saveScreenshot(file)
            this.#files.push(file)
        } catch (err) {
            log.debug(`could not save a screenshot of the heal: ${(err as Error).message}`)
        }
    }
}

/**
 * `browsingContext.startScreencast`, or undefined when the browser does not
 * record one (only Firefox implements it today)
 */
async function startScreencast (browser: WebdriverIO.Browser, dir: string) {
    if (!(browser as unknown as { isBidi?: boolean }).isBidi) {
        return undefined
    }
    try {
        const context = await browser.getWindowHandle()
        const { screencast } = await browser.browsingContextStartScreencast({ context, destinationFolder: dir })
        return screencast
    } catch (err) {
        log.debug(`the browser does not record a screencast: ${(err as Error).message}`)
        return undefined
    }
}

async function stopScreencast (browser: WebdriverIO.Browser, screencast: string) {
    try {
        const result = await browser.browsingContextStopScreencast({ screencast })
        return result.error ? undefined : result.path
    } catch (err) {
        log.debug(`could not stop the screencast: ${(err as Error).message}`)
        return undefined
    }
}
