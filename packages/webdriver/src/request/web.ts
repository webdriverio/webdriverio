import { WebDriverRequest } from './request.js'

/**
 * Cross platform implementation of a fetch based request using native fetch
 */
export class FetchRequest extends WebDriverRequest {
    fetch (url: URL, opts: RequestInit) {
        return fetch(url, opts)
    }
}
