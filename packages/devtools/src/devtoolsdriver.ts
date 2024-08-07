import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import type { EventEmitter } from 'node:events'

import { v4 as uuidv4 } from 'uuid'

import logger from '@wdio/logger'
import type { CommandEndpoint } from '@wdio/protocols'

import type { Browser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser.js'
import type { Dialog } from 'puppeteer-core/lib/esm/puppeteer/api/Dialog.js'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'
import type { Target } from 'puppeteer-core/lib/esm/puppeteer/api/Target.js'
import type { Frame } from 'puppeteer-core/lib/esm/puppeteer/api/Frame.js'

import * as commands from './commands/index.js'
import ElementStore from './elementstore.js'
import { validate, sanitizeError } from './utils.js'
import { DEFAULT_IMPLICIT_TIMEOUT, DEFAULT_PAGELOAD_TIMEOUT, DEFAULT_SCRIPT_TIMEOUT } from './constants.js'
import type { ActiveListener } from './types.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const log = logger('devtools')

export default class DevToolsDriver {
    commands: Record<string, Function> = {}
    elementStore = new ElementStore()
    windows: Map<string, Page> = new Map()
    timeouts: Map<string, number> = new Map()
    activeDialog?: Dialog = undefined

    browser: Browser
    currentFrame?: Page
    currentWindowHandle?: string
    currentFrameUrl?: string
    activeListeners: ActiveListener[] = []
    constructor(browser: Browser, pages: Page[]) {
        this.browser = browser

        const dir = path.resolve(__dirname, 'commands')
        const files = fs.readdirSync(dir).filter(
            (file) => (
                file.endsWith('.js') ||
                (
                    file.endsWith('.ts') &&
                    !file.endsWith('.d.ts')
                )
            )
        )

        for (const filename of files) {
            const commandName = path.basename(filename, path.extname(filename))

            if (!commandName) {
                throw new Error('Couldn\'t determine command name')
            }

            this.commands[commandName] = commands[commandName as keyof typeof commands]
        }

        this.initBrowser(browser, pages)
    }

    private _createWindowHandle (page: Page) {
        const pageId = uuidv4()
        this.windows.set(pageId, page)
        this.currentFrame = page
        this.currentWindowHandle = pageId
    }

    private async _targetCreatedHandler (target: Target) {
        const page = await target.page()

        if (!page) {
            return
        }

        this._createWindowHandle(page)
    }

    private async _targetDestroyedHandler (target: Target) {
        const page = await target.page()
        for (const [pageId, p] of this.windows.entries()) {
            if (page !== p) {
                continue
            }

            log.trace(`Target destroyed, removing window handle ${pageId}`)
            this.windows.delete(pageId)
            break
        }

        const pageIds = [...this.windows.keys()]
        this.currentFrame = this.windows.get(pageIds[0])
        this.currentWindowHandle = pageIds[0]
        log.trace(`Switching to window handle with id ${pageIds[0]}`)
    }

    private addListener(emitter: ActiveListener['emitter'], eventName: string, handler: any) {
        const boundHandler = handler.bind(this)
        emitter.on(eventName, boundHandler)
        this.activeListeners.push({ emitter, eventName, boundHandler })
    }

    private cleanupListeners() {
        this.activeListeners.forEach(({ emitter, eventName, boundHandler }) => {
            emitter.off(eventName, boundHandler)
        })
        this.activeListeners = []
    }

    /**
     * Inits browser listeners and sets initial handlers for given pages.
     * Function is also intended to be used while reloading DevTools session.
     * @param browser Puppeteer Browser
     * @param pages Puppeteer page array
     */
    initBrowser(browser: Browser, pages: Page[]) {
        this.cleanupListeners()
        this.elementStore = new ElementStore()
        this.windows = new Map()
        this.activeDialog = undefined
        this.browser = browser

        this.addListener(this.browser, 'targetcreated', this._targetCreatedHandler)
        this.addListener(this.browser, 'targetdestroyed', this._targetDestroyedHandler)

        for (const page of pages) {
            this._createWindowHandle(page)
        }

        /**
         * set default timeouts
         */
        this.setTimeouts(DEFAULT_IMPLICIT_TIMEOUT, DEFAULT_PAGELOAD_TIMEOUT, DEFAULT_SCRIPT_TIMEOUT)

        const page = this.getPageHandle()
        if (page) {
            this.addListener(page, 'dialog', this.dialogHandler)
            this.addListener(page, 'framenavigated', this.framenavigatedHandler)
        }
    }

    register(commandInfo: CommandEndpoint) {
        const self = this
        const { command, ref, parameters, variables = [] } = commandInfo

        /**
         * check if command is implemented
         */
        if (typeof this.commands[command] !== 'function') {
            return () => {
                throw new Error(
                    `Command "${command}" is not supported using the Devtools protocol. ` +
                    'You might want to use WebDriver as automation engine. For more ' +
                    'information check out https://webdriver.io/docs/automationProtocols!'
                )
            }
        }

        /**
         * within here you find the webdriver scope
         */
        let retries = 0
        const wrappedCommand = async function (this: EventEmitter, ...args: any[]): Promise<any> {
            await self.checkPendingNavigations()
            const params = validate(command, parameters, variables as any, ref, args)
            let result

            try {
                this.emit('command', { command, params, retries })
                result = await self.commands[command].call(self, params)
            } catch (err: any) {
                /**
                 * if though we check for an execution context before executing a command we
                 * can technically still run into the situation (especially if the command
                 * contains multiple interaction with the page and is long) where the execution
                 * context gets destroyed. For these cases handle page transitions gracefully
                 * by repeating the command.
                 */
                if (err.message.includes('most likely because of a navigation')) {
                    log.debug('Command failed due to unfinished page transition, retrying...')
                    const page = self.getPageHandle()

                    ++retries

                    // In some cases, the page load event never arrives
                    // Wait for a page load event only after trying to execute the command a few times
                    if (retries >= 3) {
                        await new Promise<void>((resolve, reject) => {
                            const pageloadTimeout = setTimeout(() => reject(new Error('page load timeout')), self.timeouts.get('pageLoad'))
                            page.once('load', () => {
                                clearTimeout(pageloadTimeout)
                                resolve()
                            })
                        })
                    }

                    return wrappedCommand.apply(this, args)
                }

                throw sanitizeError(err)
            }

            this.emit('result', { command, params, retries, result: { value: result } })
            if (typeof result !== 'undefined') {
                const isScreenshot = (
                    command.toLowerCase().includes('screenshot') &&
                    typeof result === 'string' &&
                    result.length > 64
                )
                log.info('RESULT', isScreenshot ? `${result.substr(0, 61)}...` : result)
            }

            return result
        }

        return wrappedCommand
    }

    dialogHandler(dialog: Dialog) {
        this.activeDialog = dialog
    }

    framenavigatedHandler(frame: Frame) {
        this.currentFrameUrl = frame.url()
        this.elementStore.clear(frame.parentFrame() ? frame : undefined)
    }

    setTimeouts(implicit?: number, pageLoad?: number, script?: number) {
        if (typeof implicit === 'number') {
            this.timeouts.set('implicit', implicit)
        }
        if (typeof pageLoad === 'number') {
            this.timeouts.set('pageLoad', pageLoad)
        }
        if (typeof script === 'number') {
            this.timeouts.set('script', script)
        }

        const page = this.getPageHandle()
        const pageloadTimeout = this.timeouts.get('pageLoad')
        if (page && pageloadTimeout) {
            page.setDefaultTimeout(pageloadTimeout)
        }
    }

    getPageHandle (isInFrame = false) {
        if (isInFrame && this.currentFrame) {
            return this.currentFrame
        }

        if (!this.currentWindowHandle) {
            throw new Error('no current window handle registered')
        }

        const pageHandle = this.windows.get(this.currentWindowHandle)

        if (!pageHandle) {
            throw new Error('Couldn\'t find page handle')
        }

        return pageHandle
    }

    async checkPendingNavigations (pendingNavigationStart = Date.now()) {
        /**
         * ensure there is no page transition happening and an execution context
         * is available
         */
        let page = this.getPageHandle()

        /**
         * ignore pending navigation check if dialog is open
         * or there are no pages
         */
        if (this.activeDialog || !page) {
            return
        }

        /**
         * if current page is a frame we have to get the page from the browser
         * that has this frame listed
         */
        if (!page.mainFrame) {
            const pages = await this.browser.pages()
            const mainFrame = pages.find((browserPage) => (
                browserPage.frames().find((frame: unknown) => page === frame)
            ))

            if (mainFrame) {
                page = mainFrame
            }
        }

        const pageloadTimeout = this.timeouts.get('pageLoad')
        const pageloadTimeoutReached = typeof pageloadTimeout !== 'undefined'
            ? Date.now() - pendingNavigationStart > pageloadTimeout
            : false

        try {
            const executionContext = await page.mainFrame()
            await executionContext.evaluate('1')

            /**
             * if we have an execution context, also check for the ready state
             */
            const readyState = await executionContext.evaluate('document.readyState')
            if (readyState === 'complete' || pageloadTimeoutReached) {
                return
            }
        } catch (err: any) {
            /**
             * throw original error if a context could not be established
             */
            if (pageloadTimeoutReached) {
                throw err
            }
        }

        /***
         * Avoid looping so quickly we run out of memory before the timeout.
         */
        await new Promise(resolve => setTimeout(resolve, Math.min(100, typeof pageloadTimeout === 'number' ? pageloadTimeout / 10 : 100)))
        await this.checkPendingNavigations(pendingNavigationStart)
    }
}
