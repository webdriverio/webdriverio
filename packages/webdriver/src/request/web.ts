import WebDriverRequest from './index.js'

/**
 * Cross platform implementation of a fetch based request using native fetch
 */
export default class FetchRequest extends WebDriverRequest {
    protected fetch (url: URL, opts: RequestInit) {
        return fetch(url, opts)
    }
}
