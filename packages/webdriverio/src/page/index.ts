import clone from 'lodash.clonedeep'
import { getBrowserObject } from '@wdio/utils'
import { webdriverMonad } from '@wdio/utils'

import { getContextManager } from '../session/context.js'
import { getPrototype as getWDIOPrototype } from '../utils/index.js'
import type { ContextProps } from './types.js'
import * as pageCommands from '../commands/page.js'

/**
 * transforms a findElement response into a WDIO element
 * @param  {string} selector  selector that was used to query the element
 * @param  {Object} res       findElement response
 * @return {Object}           WDIO element object
 */
export function getPage(
    this: WebdriverIO.Browser,
    contextId: string,
    props: ContextProps = { isIframe: false, isTab: false, isWindow: false, request: undefined, parent: undefined }
): WebdriverIO.Page {
    const browser = getBrowserObject(this)
    const pageCommandKeys = Object.keys(pageCommands)
    const propertiesObject: PropertyDescriptorMap = {
        /**
         * filter out browser commands from object
         */
        ...(Object.entries(clone(browser.__propertiesObject__)).reduce((commands, [name, descriptor]) => {
            if (!pageCommandKeys.includes(name)) {
                commands[name] = descriptor
            }
            return commands
        }, {} as Record<string, PropertyDescriptor>)),
        ...getWDIOPrototype('page'),
        scope: { value: 'page' }
    }

    propertiesObject.emit = { value: this.emit.bind(this) }
    const page = webdriverMonad(this.options, (client: WebdriverIO.Page) => {
        client.browser = browser
        client.contextId = contextId
        client.isIframe = props.isIframe
        client.isTab = props.isTab
        client.isWindow = props.isWindow
        client.request = props.request
        client.parent = props.parent
        return client
    }, propertiesObject)

    const pageInstance = page(this.sessionId as string)

    const origAddCommand = pageInstance.addCommand.bind(pageInstance)
    pageInstance.addCommand = (name: string, fn: Function) => {
        browser.__propertiesObject__[name] = { value: fn }
        origAddCommand(name, fn)
    }

    return pageInstance
}

export async function getBasePage(this: WebdriverIO.Browser | WebdriverIO.Element) {
    const browser = getBrowserObject(this)
    const contextManager = getContextManager(browser)
    const contextId = await contextManager.getCurrentContext()
    return getPage.call(browser, contextId, { isIframe: false, isTab: false, isWindow: true, request: undefined, parent: undefined })
}