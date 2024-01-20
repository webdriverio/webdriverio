import logger from '@wdio/logger'

import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject } from '../../utils/index.js'
import { compute } from '../../scripts/scrollIntoViewDeltaCalcScript.js'

const log = logger('webdriverio')

function scrollIntoViewWeb (
    this: WebdriverIO.Element,
    options: ScrollIntoViewOptions | boolean = { block: 'start', inline: 'nearest' }
) {
    const browser = getBrowserObject(this)
    return browser.execute(
        (elem: HTMLElement, options: ScrollIntoViewOptions | boolean) => elem.scrollIntoView(options),
        {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId, // jsonwp compatible
        } as any as HTMLElement,
        options,
    )
}

/**
 *
 * Scroll element into viewport ([MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)).
 *
 * <example>
    :scrollIntoView.js
    it('should demonstrate the scrollIntoView command', async () => {
        const elem = await $('#myElement');
        // scroll to specific element
        await elem.scrollIntoView();
        // center element within the viewport
        await elem.scrollIntoView({ block: 'center', inline: 'center' });
    });
 * </example>
 *
 * @alias element.scrollIntoView
 * @param {object|boolean=} scrollIntoViewOptions  options for `Element.scrollIntoView()` (default: `{ block: 'start', inline: 'nearest' }`)
 * @uses protocol/execute
 * @type utility
 *
 */
export async function scrollIntoView (
    this: WebdriverIO.Element,
    options: ScrollIntoViewOptions & {scrollMode?: 'if-needed' | 'always'} | boolean = { block: 'start', inline: 'nearest', scrollMode: 'if-needed' }
) {
    const browser = getBrowserObject(this)

    /**
     * Appium does not support the "wheel" action
     */
    if (browser.isMobile) {
        return scrollIntoViewWeb.call(this, options as any)
    }
    const element = {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId, // jsonwp compatible
    } as any as HTMLElement
    let parsedOptions

    if (typeof options === 'boolean') {
        parsedOptions = options ? { scrollMode: 'always', block: 'start', inline: 'nearest' } : { scrollMode: 'always', block: 'end', inline: 'nearest' }
    } else if (!options.scrollMode) {
        parsedOptions = { ...options, ...{ scrollMode: 'if-needed' } }
    } else {
        parsedOptions = options
    }
    try {
        const deltaPosition = (await browser.execute(
            compute,
            element,
            parsedOptions as Record<string, any>
        )) as {
            el?: Element;
            top: number;
            left: number;
            isVisible?: boolean
        }
        // eslint-disable-next-line unicorn/prefer-ternary
        if (deltaPosition && 'isVisible' in deltaPosition && deltaPosition.isVisible && parsedOptions.scrollMode !== 'if-needed') {
            await scrollIntoViewWeb.call(this, options as any)
        } else {
            await browser
                .action('wheel')
                .scroll({
                    duration: 50,
                    deltaX: Math.round(deltaPosition && deltaPosition.left ? deltaPosition.left : 0),
                    deltaY: Math.round(deltaPosition && deltaPosition.top ? deltaPosition.top : 0),
                    origin: this,
                })
                .perform()
        }
    } catch (err: any) {
        log.warn(
            `Failed to execute "scrollIntoView" using WebDriver Actions API: ${err.message}!\n` +
            'Re-attempting using `Element.scrollIntoView` via Web API.'
        )
        await scrollIntoViewWeb.call(this, options as any)
    }
}
