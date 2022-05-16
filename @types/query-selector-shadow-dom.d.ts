const ExecuteMethod = (element: Element | Document, selector: string) => Element | null;

/**
 * Contains two functions `queryOne` and `queryAll` that can
 * be {@link Puppeteer.registerCustomQueryHandler | registered}
 * as alternative querying strategies. The functions `queryOne` and `queryAll`
 * are executed in the page context.  `queryOne` should take an `Element` and a
 * selector string as argument and return a single `Element` or `null` if no
 * element is found. `queryAll` takes the same arguments but should instead
 * return a `NodeListOf<Element>` or `Array<Element>` with all the elements
 * that match the given query selector.
 * @public
 */
interface CustomQueryHandler {
    queryOne?: ExecuteMethod
    queryAll?: (element: Element | Document, selector: string) => Element[] | NodeListOf<Element>;
}

declare const querySelectorShadowDom: {
    QueryHandler: CustomQueryHandler
    locatorStrategy: ExecuteMethod
}

declare module "query-selector-shadow-dom/plugins/puppeteer/index.js" {
    export = querySelectorShadowDom
}

declare module "query-selector-shadow-dom/plugins/webdriverio" {
    export = querySelectorShadowDom
}
